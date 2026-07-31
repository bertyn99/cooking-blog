<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatMediaByteSize, isWithinImageUploadLimit, maxImageUploadSizeLabel, MEDIA_GALLERY_PAGE_SIZE } from '#shared/media'
import { MEDIA_UPLOAD_ROOT, mediaKindLabel, type MediaKind } from '#shared/media-paths'
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { DASHBOARD_SURFACE_CLASS, DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'

interface MediaBlob {
  pathname: string
  contentType?: string
  size?: number
  uploadedAt?: string
  originalName?: string
  kind: MediaKind
}

interface MediaFolder {
  slug: string
  name: string
  prefix: string
  itemCount: number
}

interface MediaListResponse {
  blobs: MediaBlob[]
  folders: MediaFolder[]
  prefix: string
  hasMore: boolean
  cursor?: string
}

const PAGE_SIZE = MEDIA_GALLERY_PAGE_SIZE

const loadMoreSentinel = ref<HTMLElement | null>(null)

const { $api } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const viewMode = ref<'grid' | 'table'>('grid')
const search = ref('')
const uploading = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

const blobs = ref<MediaBlob[]>([])
const folders = ref<MediaFolder[]>([])
const hasMore = ref(false)
const cursor = ref<string | undefined>()

const folderPrefix = computed(() => {
  const raw = route.query.folder
  if (!raw || raw === '/') {
    return MEDIA_UPLOAD_ROOT
  }
  const segment = Array.isArray(raw) ? raw[0] : raw
  const path = decodeURIComponent(segment).replace(/^\/+/, '')
  return path.startsWith('uploads/') ? (path.endsWith('/') ? path : `${path}/`) : `${MEDIA_UPLOAD_ROOT}${path}${path.endsWith('/') ? '' : '/'}`
})

const detailOpen = ref(false)
const detailPathname = ref<string | null>(null)
const folderModalOpen = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)
const folderToDelete = ref<MediaFolder | null>(null)
const deletingFolder = ref(false)

const folderDeleteOpen = computed({
  get: () => folderToDelete.value !== null,
  set: (open: boolean) => {
    if (!open) {
      folderToDelete.value = null
    }
  },
})

const breadcrumbs = computed(() => {
  const crumbs: { label: string, prefix: string }[] = [
    { label: 'Médiathèque', prefix: MEDIA_UPLOAD_ROOT },
  ]
  const relative = folderPrefix.value.slice(MEDIA_UPLOAD_ROOT.length)
  if (!relative) {
    return crumbs
  }
  const parts = relative.split('/').filter(Boolean)
  let acc = MEDIA_UPLOAD_ROOT
  for (const part of parts) {
    acc += `${part}/`
    crumbs.push({ label: part.replace(/-/g, ' '), prefix: acc })
  }
  return crumbs
})

const filteredFolders = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = folders.value
  if (!q) {
    return list
  }
  return list.filter(f => f.name.toLowerCase().includes(q) || f.slug.includes(q))
})

const filteredBlobs = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = blobs.value
  if (!q) {
    return list
  }
  return list.filter((blob) => {
    const name = blob.originalName ?? blob.pathname
    return name.toLowerCase().includes(q) || blob.pathname.toLowerCase().includes(q)
  })
})

const totalLabel = computed(() => {
  const fileCount = blobs.value.length
  const folderCount = folders.value.length
  const parts: string[] = []
  if (folderCount) {
    parts.push(`${folderCount} dossier${folderCount > 1 ? 's' : ''}`)
  }
  parts.push(`${fileCount} fichier${fileCount > 1 ? 's' : ''}`)
  if (hasMore.value && !search.value.trim()) {
    parts.push('liste partielle')
  }
  return parts.join(', ')
})

function kindBadgeColor(kind: MediaKind) {
  switch (kind) {
    case 'image':
      return 'primary' as const
    case 'folder':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function displayName(blob: MediaBlob) {
  return blob.originalName ?? blob.pathname.split('/').pop() ?? blob.pathname
}

function formatSizeCell(bytes?: number) {
  return bytes ? formatMediaByteSize(bytes) : 'N/A'
}

async function fetchMedia(append: boolean) {
  if (append) {
    loadingMore.value = true
  }
  else {
    loading.value = true
    cursor.value = undefined
  }

  try {
    const res = await $api<MediaListResponse>('/api/media', {
      query: {
        limit: PAGE_SIZE,
        prefix: folderPrefix.value,
        ...(append && cursor.value ? { cursor: cursor.value } : {}),
      },
    })
    blobs.value = append ? [...blobs.value, ...res.blobs] : res.blobs
    if (!append) {
      folders.value = res.folders
    }
    hasMore.value = res.hasMore
    cursor.value = res.cursor
  }
  catch (error: unknown) {
    toast.add({
      title: 'Impossible de charger les médias',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function refresh() {
  await fetchMedia(false)
}

watch(folderPrefix, () => {
  void fetchMedia(false)
}, { immediate: true })

useMediaGalleryInfiniteScroll(loadMoreSentinel, {
  hasMore,
  loading,
  loadingMore,
  search,
  viewMode,
  onLoadMore: () => fetchMedia(true),
})

function navigateToFolder(prefix: string) {
  const relative = prefix.slice(MEDIA_UPLOAD_ROOT.length).replace(/\/$/, '')
  if (!relative) {
    void router.push({ path: '/media' })
    return
  }
  void router.push({ path: '/media', query: { folder: relative } })
}

function openDetail(pathname: string) {
  detailPathname.value = pathname
  detailOpen.value = true
}

function openFilePicker() {
  fileInput.value?.click()
}

function fileFromDataTransfer(dataTransfer: DataTransfer | null): File | undefined {
  if (!dataTransfer?.files.length) {
    return undefined
  }
  return dataTransfer.files[0]
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toast.add({ title: 'Images uniquement', color: 'warning' })
    return
  }
  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: maxImageUploadSizeLabel(),
      color: 'warning',
    })
    return
  }
  uploading.value = true
  try {
    const prepared = await prepareImageForUpload(file)
    const formData = new FormData()
    formData.append('file', prepared)
    formData.append('folderPrefix', folderPrefix.value)
    await $api('/api/media', { method: 'POST', body: formData })
    toast.add({ title: 'Image importée', color: 'success' })
    await refresh()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec de l\'import',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    uploading.value = false
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await uploadFile(file)
  }
  input.value = ''
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function onDragLeave(event: DragEvent) {
  if (event.currentTarget === event.target) {
    dragOver.value = false
  }
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  const file = fileFromDataTransfer(event.dataTransfer)
  if (file) {
    await uploadFile(file)
  }
}

async function createFolder() {
  const name = newFolderName.value.trim()
  if (!name) {
    return
  }
  creatingFolder.value = true
  try {
    await $api('/api/media/folder', {
      method: 'POST',
      body: { name, parentPrefix: folderPrefix.value },
    })
    toast.add({ title: 'Dossier créé', color: 'success' })
    folderModalOpen.value = false
    newFolderName.value = ''
    await refresh()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Impossible de créer le dossier',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    creatingFolder.value = false
  }
}

async function deleteFolder() {
  if (!folderToDelete.value) {
    return
  }
  deletingFolder.value = true
  try {
    await $api('/api/media/folder', {
      method: 'DELETE',
      body: { prefix: folderToDelete.value.prefix },
    })
    toast.add({ title: 'Dossier supprimé', color: 'success' })
    folderToDelete.value = null
    await refresh()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Suppression impossible',
      description: readApiErrorMessage(error, 'Réessayez.'),
      color: 'error',
    })
  }
  finally {
    deletingFolder.value = false
  }
}

const columns: TableColumn<MediaBlob>[] = [
  {
    accessorKey: 'originalName',
    header: 'Fichier',
    cell: ({ row }) => h('button', {
      type: 'button',
      class: 'flex w-full items-center gap-3 text-left hover:text-primary',
      onClick: () => openDetail(row.original.pathname),
    }, [
      row.original.kind === 'image'
        ? h('div', {
          class: 'size-10 shrink-0 overflow-hidden rounded-md ring-1 ring-default/60',
        }, [
          h(resolveComponent('MediaLazyThumb'), {
            pathname: row.original.pathname,
            alt: '',
            imgClass: 'size-full object-cover',
          }),
        ])
        : h(resolveComponent('UIcon'), { name: 'i-lucide-file', class: 'size-10 text-muted' }),
      h('span', { class: 'truncate font-medium' }, displayName(row.original)),
    ]),
  },
  {
    id: 'kind',
    header: 'Type',
    cell: ({ row }) => h(resolveComponent('UBadge'), {
      color: kindBadgeColor(row.original.kind),
      variant: 'subtle',
      size: 'sm',
    }, () => mediaKindLabel(row.original.kind)),
  },
  {
    accessorKey: 'size',
    header: 'Taille',
    cell: ({ row }) => formatSizeCell(row.original.size),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => h(resolveComponent('UButton'), {
      icon: 'i-lucide-ellipsis',
      color: 'neutral',
      variant: 'ghost',
      size: 'xs',
      onClick: () => openDetail(row.original.pathname),
    }),
  },
]
</script>

<template>
  <AppDashboardPanel id="media">
    <template #header>
      <AppDashboardNavbar title="Médias">
        <template #right>
          <UButton
            icon="i-lucide-folder-plus"
            variant="outline"
            label="Nouveau dossier"
            class="hidden sm:inline-flex"
            @click="folderModalOpen = true"
          />
          <UButton
            icon="i-lucide-folder-plus"
            variant="outline"
            class="sm:hidden"
            aria-label="Nouveau dossier"
            @click="folderModalOpen = true"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="outline"
            label="Actualiser"
            class="hidden sm:inline-flex"
            :loading="loading"
            @click="refresh()"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="outline"
            class="sm:hidden"
            aria-label="Actualiser"
            :loading="loading"
            @click="refresh()"
          />
          <UButton
            icon="i-lucide-upload"
            label="Importer"
            :loading="uploading"
            @click="openFilePicker"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          >
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-5">
        <div
          role="button"
          tabindex="0"
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:justify-between sm:py-4 sm:text-left"
          :class="[
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-default/80 bg-elevated/25 hover:border-primary/40 hover:bg-elevated/40',
            uploading ? 'pointer-events-none opacity-60' : '',
          ]"
          @click="!uploading && openFilePicker()"
          @keydown.enter.prevent="!uploading && openFilePicker()"
          @keydown.space.prevent="!uploading && openFilePicker()"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <UIcon
                :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-cloud-upload'"
                class="size-5"
                :class="uploading ? 'animate-spin' : ''"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">
                {{ uploading ? 'Import en cours…' : 'Glissez une image ou cliquez pour importer' }}
              </p>
              <p class="text-xs text-muted">
                WebP après compression · max. {{ maxImageUploadSizeLabel() }}
              </p>
            </div>
          </div>
          <UButton
            label="Parcourir"
            color="neutral"
            variant="outline"
            size="sm"
            class="shrink-0"
            :loading="uploading"
            @click.stop="openFilePicker"
          />
        </div>

        <div
          :class="[DASHBOARD_SURFACE_CLASS, 'flex flex-col gap-3 p-3 sm:p-4']"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <nav class="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted">
              <template
                v-for="(crumb, index) in breadcrumbs"
                :key="crumb.prefix"
              >
                <button
                  v-if="index < breadcrumbs.length - 1"
                  type="button"
                  class="truncate hover:text-primary"
                  @click="navigateToFolder(crumb.prefix)"
                >
                  {{ crumb.label }}
                </button>
                <span
                  v-else
                  class="truncate font-medium text-highlighted"
                >{{ crumb.label }}</span>
                <UIcon
                  v-if="index < breadcrumbs.length - 1"
                  name="i-lucide-chevron-right"
                  class="size-3.5 shrink-0"
                />
              </template>
            </nav>
            <p class="text-xs text-muted">
              {{ totalLabel }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Rechercher un fichier ou dossier…"
              class="min-w-[12rem] flex-1"
            />
            <UFieldGroup>
              <UButton
                icon="i-lucide-layout-grid"
                :color="viewMode === 'grid' ? 'primary' : 'neutral'"
                variant="outline"
                aria-label="Vue grille"
                @click="viewMode = 'grid'"
              />
              <UButton
                icon="i-lucide-list"
                :color="viewMode === 'table' ? 'primary' : 'neutral'"
                variant="outline"
                aria-label="Vue tableau"
                @click="viewMode = 'table'"
              />
            </UFieldGroup>
          </div>
        </div>

        <section
          v-if="filteredFolders.length"
          class="flex flex-col gap-2"
        >
          <h2 class="text-sm font-semibold text-highlighted">
            Dossiers
          </h2>
          <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="folder in filteredFolders"
              :key="folder.prefix"
              class="group relative flex items-center gap-3 rounded-lg border border-default/70 bg-default px-3 py-2.5 transition hover:border-primary/35"
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
                @click="navigateToFolder(folder.prefix)"
              >
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400"
                >
                  <UIcon
                    name="i-lucide-folder"
                    class="size-5"
                  />
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-highlighted">
                    {{ folder.name }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ folder.itemCount }} élément{{ folder.itemCount > 1 ? 's' : '' }}
                  </p>
                </div>
              </button>
              <UDropdownMenu
                :items="[[
                  { label: 'Ouvrir', icon: 'i-lucide-folder-open', onSelect: () => navigateToFolder(folder.prefix) },
                  { label: 'Supprimer…', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { folderToDelete = folder } },
                ]]"
              >
                <UButton
                  icon="i-lucide-ellipsis-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                />
              </UDropdownMenu>
            </div>
          </div>
        </section>

        <section v-if="viewMode === 'grid'">
          <div
            v-if="loading && !filteredBlobs.length"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <USkeleton
              v-for="i in 8"
              :key="i"
              class="aspect-square rounded-lg"
            />
          </div>

          <div
            v-else-if="filteredBlobs.length"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            <MediaGalleryCard
              v-for="blob in filteredBlobs"
              :key="blob.pathname"
              :pathname="blob.pathname"
              :kind="blob.kind"
              :original-name="blob.originalName"
              :size="blob.size"
              @open="openDetail(blob.pathname)"
            />
          </div>

          <UAlert
            v-else-if="!filteredFolders.length"
            color="neutral"
            variant="subtle"
            icon="i-lucide-images"
            :title="search ? 'Aucun résultat' : 'Aucun média ici'"
            :description="search
              ? 'Modifiez la recherche ou importez une nouvelle image.'
              : 'Importez une image ou créez un dossier pour commencer.'"
          />
        </section>

        <UTable
          v-else
          :data="filteredBlobs"
          :columns="columns"
          :loading="loading"
          :ui="DASHBOARD_TABLE_UI"
        />

        <div
          v-if="hasMore && !search.trim() && viewMode === 'grid'"
          ref="loadMoreSentinel"
          class="flex min-h-8 justify-center pt-1"
          aria-hidden="true"
        >
          <UIcon
            v-if="loadingMore"
            name="i-lucide-loader-circle"
            class="size-5 animate-spin text-muted"
            aria-label="Chargement de fichiers supplémentaires"
          />
        </div>
      </div>

      <MediaDetailSlideover
        v-model:open="detailOpen"
        :pathname="detailPathname"
        @updated="refresh()"
        @deleted="refresh()"
      />
    </template>
  </AppDashboardPanel>

  <UModal
    v-model:open="folderModalOpen"
    title="Nouveau dossier"
  >
    <template #body>
      <UFormField label="Nom du dossier">
        <UInput
          v-model="newFolderName"
          placeholder="Ex. Couvertures blog"
          @keydown.enter.prevent="createFolder"
        />
      </UFormField>
    </template>
    <template #footer>
      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        @click="folderModalOpen = false"
      />
      <UButton
        label="Créer"
        :loading="creatingFolder"
        :disabled="!newFolderName.trim()"
        @click="createFolder"
      />
    </template>
  </UModal>

  <UModal
    v-model:open="folderDeleteOpen"
    title="Supprimer le dossier ?"
  >
    <template #body>
      <p class="text-sm text-muted">
        Le dossier <strong>{{ folderToDelete?.name }}</strong> et tout son contenu ({{ folderToDelete?.itemCount }}
        fichier(s)) seront supprimés définitivement.
      </p>
    </template>
    <template #footer>
      <UButton
        label="Annuler"
        color="neutral"
        variant="ghost"
        @click="folderToDelete = null"
      />
      <UButton
        label="Tout supprimer"
        color="error"
        :loading="deletingFolder"
        @click="deleteFolder"
      />
    </template>
  </UModal>
</template>
