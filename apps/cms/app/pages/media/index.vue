<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatMediaByteSize, isWithinImageUploadLimit, maxImageUploadSizeLabel } from '#shared/media'
import { MEDIA_UPLOAD_ROOT, mediaKindLabel, type MediaKind } from '#shared/media-paths'
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { DASHBOARD_TABLE_UI } from '~/utils/dashboard-shell'
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

const { $api } = useNuxtApp()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const viewMode = ref<'grid' | 'table'>('grid')
const search = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const folderPrefix = computed(() => {
  const raw = route.query.folder
  if (!raw || raw === '/') {
    return MEDIA_UPLOAD_ROOT
  }
  const segment = Array.isArray(raw) ? raw[0] : raw
  const path = decodeURIComponent(segment).replace(/^\/+/, '')
  return path.startsWith('uploads/') ? (path.endsWith('/') ? path : `${path}/`) : `${MEDIA_UPLOAD_ROOT}${path}${path.endsWith('/') ? '' : '/'}`
})

const { data, status, refresh } = await useAsyncData(
  'media-list',
  () => $api<MediaListResponse>('/api/media', {
    query: { limit: 60, prefix: folderPrefix.value },
  }),
  { server: false, watch: [folderPrefix] },
)

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
  const folders = data.value?.folders ?? []
  if (!q) {
    return folders
  }
  return folders.filter(f => f.name.toLowerCase().includes(q) || f.slug.includes(q))
})

const filteredBlobs = computed(() => {
  const q = search.value.trim().toLowerCase()
  const blobs = data.value?.blobs ?? []
  if (!q) {
    return blobs
  }
  return blobs.filter((blob) => {
    const name = blob.originalName ?? blob.pathname
    return name.toLowerCase().includes(q) || blob.pathname.toLowerCase().includes(q)
  })
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
        ? h('img', {
          src: mediaPublicUrl(row.original.pathname),
          class: 'size-10 rounded object-cover',
          alt: '',
        })
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
    cell: ({ row }) => row.original.size ? formatMediaByteSize(row.original.size) : '—',
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
          <UButton icon="i-lucide-folder-plus" variant="outline" label="Nouveau dossier"
            @click="folderModalOpen = true" />
          <UButton icon="i-lucide-refresh-cw" variant="outline" label="Actualiser" :loading="status === 'pending'"
            @click="refresh()" />
          <UButton icon="i-lucide-upload" label="Importer" :loading="uploading" @click="openFilePicker" />
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange">
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <nav class="flex flex-wrap items-center gap-1 text-sm text-muted">
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.prefix">
            <button v-if="index < breadcrumbs.length - 1" type="button" class="hover:text-primary"
              @click="navigateToFolder(crumb.prefix)">
              {{ crumb.label }}
            </button>
            <span v-else class="font-medium text-highlighted">{{ crumb.label }}</span>
            <UIcon v-if="index < breadcrumbs.length - 1" name="i-lucide-chevron-right" class="size-3.5" />
          </template>
        </nav>

        <div class="flex flex-wrap items-center gap-2">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher…" class="min-w-[12rem] flex-1" />
          <UFieldGroup>
            <UButton icon="i-lucide-layout-grid" :color="viewMode === 'grid' ? 'primary' : 'neutral'" variant="outline"
              aria-label="Vue grille" @click="viewMode = 'grid'" />
            <UButton icon="i-lucide-list" :color="viewMode === 'table' ? 'primary' : 'neutral'" variant="outline"
              aria-label="Vue tableau" @click="viewMode = 'table'" />
          </UFieldGroup>
        </div>

        <div v-if="filteredFolders.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="folder in filteredFolders" :key="folder.prefix"
            class="group relative flex items-start gap-3 rounded-xl border border-default bg-elevated/30 p-4 transition hover:border-primary/40">
            <button type="button" class="flex min-w-0 flex-1 items-start gap-3 text-left"
              @click="navigateToFolder(folder.prefix)">
              <UIcon name="i-lucide-folder" class="size-10 shrink-0 text-amber-500" />
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ folder.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ folder.itemCount }} élément{{ folder.itemCount > 1 ? 's' : '' }}
                </p>
              </div>
            </button>
            <UDropdownMenu :items="[[
              { label: 'Ouvrir', icon: 'i-lucide-folder-open', onSelect: () => navigateToFolder(folder.prefix) },
              { label: 'Supprimer…', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { folderToDelete = folder } },
            ]]">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" size="xs"
                class="opacity-0 group-hover:opacity-100" />
            </UDropdownMenu>
          </div>
        </div>

        <div v-if="viewMode === 'grid'">
          <div v-if="status === 'pending' && !filteredBlobs.length"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <USkeleton v-for="i in 10" :key="i" class="aspect-square rounded-xl" />
          </div>

          <div v-else-if="filteredBlobs.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <button v-for="blob in filteredBlobs" :key="blob.pathname" type="button"
              class="group relative overflow-hidden rounded-xl border border-default bg-elevated/20 text-left transition hover:border-primary/50"
              @click="openDetail(blob.pathname)">
              <img v-if="blob.kind === 'image'" :src="mediaPublicUrl(blob.pathname)" :alt="displayName(blob)"
                class="aspect-square w-full object-cover" loading="lazy">
              <div v-else class="flex aspect-square items-center justify-center bg-elevated/50">
                <UIcon name="i-lucide-file" class="size-12 text-muted" />
              </div>
              <div class="absolute left-2 top-2">
                <UBadge :color="kindBadgeColor(blob.kind)" variant="solid" size="sm">
                  {{ mediaKindLabel(blob.kind) }}
                </UBadge>
              </div>
              <div class="border-t border-default bg-default/90 px-2 py-2">
                <p class="truncate text-xs font-medium">
                  {{ displayName(blob) }}
                </p>
                <p v-if="blob.size" class="text-[10px] text-muted">
                  {{ formatMediaByteSize(blob.size) }}
                </p>
              </div>
            </button>
          </div>

          <UAlert v-else-if="!filteredFolders.length" color="neutral" variant="subtle" icon="i-lucide-images"
            title="Aucun média ici" description="Importez une image ou créez un dossier." />
        </div>

        <UTable
          v-else
          :data="filteredBlobs"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="DASHBOARD_TABLE_UI"
        />
      </div>

      <MediaDetailSlideover v-model:open="detailOpen" :pathname="detailPathname" @updated="refresh()"
        @deleted="refresh()" />
    </template>
  </AppDashboardPanel>

  <UModal v-model:open="folderModalOpen" title="Nouveau dossier">
    <template #body>
      <UFormField label="Nom du dossier">
        <UInput v-model="newFolderName" placeholder="Ex. Couvertures blog" @keydown.enter.prevent="createFolder" />
      </UFormField>
    </template>
    <template #footer>
      <UButton label="Annuler" color="neutral" variant="ghost" @click="folderModalOpen = false" />
      <UButton label="Créer" :loading="creatingFolder" :disabled="!newFolderName.trim()" @click="createFolder" />
    </template>
  </UModal>

  <UModal v-model:open="folderDeleteOpen" title="Supprimer le dossier ?">
    <template #body>
      <p class="text-sm text-muted">
        Le dossier <strong>{{ folderToDelete?.name }}</strong> et tout son contenu ({{ folderToDelete?.itemCount }}
        fichier(s)) seront supprimés définitivement.
      </p>
    </template>
    <template #footer>
      <UButton label="Annuler" color="neutral" variant="ghost" @click="folderToDelete = null" />
      <UButton label="Tout supprimer" color="error" :loading="deletingFolder" @click="deleteFolder" />
    </template>
  </UModal>
</template>
