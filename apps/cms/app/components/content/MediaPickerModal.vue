<script setup lang="ts">
import { mediaPickerThumbUrl, mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'
import { uploadMediaFile } from '~/utils/upload-media.client'
import {
  formatMediaByteSize,
  isWithinImageUploadLimit,
  maxImageUploadSizeLabel,
} from '#shared/media'

const open = defineModel<boolean>('open', { required: true })

const props = withDefaults(defineProps<{
  title?: string
  selectedPathname?: string | null
  /** Upload then auto-select and close */
  selectOnUpload?: boolean
  /** Compress only; emit `selectLocal` instead of uploading (new article draft). */
  deferUpload?: boolean
}>(), {
  title: 'Bibliothèque médias',
  selectedPathname: null,
  selectOnUpload: true,
  deferUpload: false,
})

const emit = defineEmits<{
  select: [pathname: string]
  selectLocal: [payload: { previewUrl: string, file: File }]
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const search = ref('')
const dragOver = ref(false)
const pendingPathname = ref<string | null>(null)
const pendingLocal = ref<{ previewUrl: string, file: File, name: string } | null>(null)

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i

function transferHasFiles(dataTransfer: DataTransfer | null) {
  return dataTransfer?.types.includes('Files') ?? false
}

function fileFromDataTransfer(dataTransfer: DataTransfer | null): File | undefined {
  if (!dataTransfer) {
    return undefined
  }
  if (dataTransfer.files.length > 0) {
    return dataTransfer.files[0]
  }
  for (const item of dataTransfer.items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        return file
      }
    }
  }
  return undefined
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) {
    return true
  }
  return IMAGE_EXT.test(file.name)
}

interface MediaBlob {
  pathname: string
  contentType?: string
  size?: number
  originalName?: string
}

interface MediaListResponse {
  blobs: MediaBlob[]
  folders?: { slug: string, name: string, prefix: string, itemCount: number }[]
  prefix?: string
  hasMore: boolean
  cursor?: string
}

const blobs = ref<MediaBlob[]>([])
const hasMore = ref(false)
const cursor = ref<string | undefined>()
const loading = ref(false)
const loadingMore = ref(false)

async function fetchPage(append: boolean) {
  if (append) {
    loadingMore.value = true
  }
  else {
    loading.value = true
  }

  try {
    const res = await $api<MediaListResponse>('/api/media', {
      query: {
        limit: 48,
        prefix: '',
        ...(append && cursor.value ? { cursor: cursor.value } : {}),
      },
    })
    blobs.value = append ? [...blobs.value, ...res.blobs] : res.blobs
    hasMore.value = res.hasMore
    cursor.value = res.cursor
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function refreshGallery() {
  cursor.value = undefined
  await fetchPage(false)
}

function revokePendingLocal() {
  if (pendingLocal.value) {
    URL.revokeObjectURL(pendingLocal.value.previewUrl)
    pendingLocal.value = null
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    search.value = ''
    pendingPathname.value = props.selectedPathname
    revokePendingLocal()
    refreshGallery()
  }
  else {
    dragOver.value = false
    revokePendingLocal()
  }
})

watch(() => props.selectedPathname, (value) => {
  if (open.value && value) {
    pendingPathname.value = value
  }
})

const filteredBlobs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) {
    return blobs.value
  }
  return blobs.value.filter((blob) => {
    const name = blob.originalName ?? blob.pathname
    return name.toLowerCase().includes(q) || blob.pathname.toLowerCase().includes(q)
  })
})

const hasGalleryItems = computed(() => blobs.value.length > 0)

function openFilePicker() {
  fileInput.value?.click()
}

async function stageLocalFile(file: File) {
  if (!isImageFile(file)) {
    toast.add({ title: 'Fichier non supporté', description: 'Choisissez une image.', color: 'warning' })
    return
  }

  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: `Taille max. ${maxImageUploadSizeLabel()} (fichier : ${formatMediaByteSize(file.size)}).`,
      color: 'warning',
    })
    return
  }

  uploading.value = true
  try {
    const prepared = await prepareImageForUpload(file)
    const previewUrl = URL.createObjectURL(prepared)
    pendingLocal.value = { previewUrl, file: prepared, name: prepared.name }
    pendingPathname.value = null
    toast.add({
      title: 'Image compressée',
      description: 'Elle sera envoyée lors de l’enregistrement de l’article.',
      color: 'neutral',
    })

    if (props.selectOnUpload) {
      confirmSelection()
    }
  }
  finally {
    uploading.value = false
  }
}

async function uploadFile(file: File) {
  if (props.deferUpload) {
    await stageLocalFile(file)
    return
  }
  if (!isImageFile(file)) {
    toast.add({ title: 'Fichier non supporté', description: 'Choisissez une image.', color: 'warning' })
    return
  }

  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: `Taille max. ${maxImageUploadSizeLabel()} (fichier : ${formatMediaByteSize(file.size)}).`,
      color: 'warning',
    })
    return
  }

  uploading.value = true
  try {
    const prepared = await prepareImageForUpload(file)
    const pathname = await uploadMediaFile(prepared)
    await refreshGallery()
    pendingPathname.value = pathname
    toast.add({ title: 'Image importée', color: 'success' })

    if (props.selectOnUpload) {
      confirmSelection()
    }
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec de l\'import',
      description: readApiErrorMessage(error, 'Réessayez ou choisissez un fichier plus léger.'),
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

function onDragEnter(event: DragEvent) {
  if (!transferHasFiles(event.dataTransfer)) {
    return
  }
  event.preventDefault()
  dragOver.value = true
}

function onDragOver(event: DragEvent) {
  if (!transferHasFiles(event.dataTransfer)) {
    return
  }
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
  dragOver.value = true
}

function onDragLeave(event: DragEvent) {
  const zone = event.currentTarget as HTMLElement
  const related = event.relatedTarget as Node | null
  if (related && zone.contains(related)) {
    return
  }
  dragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragOver.value = false
  const file = fileFromDataTransfer(event.dataTransfer)
  if (file) {
    void uploadFile(file)
  }
}

function selectPending(pathname: string) {
  pendingPathname.value = pathname
  pendingLocal.value = null
}

function confirmSelection() {
  if (pendingLocal.value) {
    emit('selectLocal', {
      previewUrl: pendingLocal.value.previewUrl,
      file: pendingLocal.value.file,
    })
    open.value = false
    pendingLocal.value = null
    return
  }
  if (!pendingPathname.value) {
    return
  }
  emit('select', pendingPathname.value)
  open.value = false
}

function formatSize(bytes?: number) {
  if (!bytes) {
    return ''
  }
  if (bytes < 1024) {
    return `${bytes} o`
  }
  return `${Math.round(bytes / 1024)} Ko`
}

function displayName(blob: MediaBlob) {
  return blob.originalName ?? blob.pathname.split('/').pop() ?? blob.pathname
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <div
          role="button"
          tabindex="0"
          class="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :class="[
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-default bg-elevated/30 hover:border-primary/50 hover:bg-elevated/50',
            uploading ? 'pointer-events-none opacity-60' : '',
          ]"
          @click="!uploading && openFilePicker()"
          @keydown.enter.prevent="!uploading && openFilePicker()"
          @keydown.space.prevent="!uploading && openFilePicker()"
          @dragenter="onDragEnter"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <UIcon
            :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-cloud-upload'"
            class="size-10"
            :class="uploading ? 'animate-spin text-muted' : 'text-primary'"
          />
          <span class="text-sm font-medium text-highlighted">
            {{ uploading ? 'Compression…' : 'Glissez une image ici ou cliquez pour parcourir' }}
          </span>
          <span class="text-xs text-muted">
            <template v-if="deferUpload">
              Compression WebP locale — envoi à l’enregistrement de l’article
            </template>
            <template v-else>
              JPEG, PNG, WebP, GIF — max. {{ maxImageUploadSizeLabel() }} avant compression WebP
            </template>
          </span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          >
        </div>

        <!-- Gallery toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Rechercher un fichier…"
            class="min-w-[12rem] flex-1"
            :disabled="!hasGalleryItems && !loading"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            label="Actualiser"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="loading"
            @click="refreshGallery"
          />
        </div>

        <!-- Grid -->
        <div
          v-if="loading && !blobs.length"
          class="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          <USkeleton v-for="index in 8" :key="index" class="aspect-square w-full rounded-lg" />
        </div>

        <div
          v-else-if="filteredBlobs.length"
          class="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-default bg-elevated/20 p-2"
        >
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              v-for="blob in filteredBlobs"
              :key="blob.pathname"
              type="button"
              class="group relative overflow-hidden rounded-lg border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              :class="pendingPathname === blob.pathname
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent hover:border-default'"
              @click="selectPending(blob.pathname)"
              @dblclick="selectPending(blob.pathname); confirmSelection()"
            >
              <img
                :src="mediaPickerThumbUrl(blob.pathname)"
                :alt="displayName(blob)"
                class="aspect-square w-full object-cover"
                loading="lazy"
              >
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1.5 pt-6"
              >
                <p class="truncate text-[10px] font-medium text-white">
                  {{ displayName(blob) }}
                </p>
                <p v-if="blob.size" class="text-[9px] text-white/80">
                  {{ formatSize(blob.size) }}
                </p>
              </div>
              <div
                v-if="pendingPathname === blob.pathname"
                class="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow"
              >
                <UIcon name="i-lucide-check" class="size-3.5" />
              </div>
            </button>
          </div>
        </div>

        <div v-if="hasMore && !search" class="flex justify-center">
          <UButton
            label="Charger plus"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="loadingMore"
            @click="fetchPage(true)"
          />
        </div>

        <UAlert
          v-if="!loading && !filteredBlobs.length"
          color="neutral"
          variant="subtle"
          icon="i-lucide-images"
          :title="search ? 'Aucun résultat' : 'Médiathèque vide'"
          :description="search
            ? 'Essayez un autre terme ou importez une nouvelle image.'
            : 'Importez votre première image avec la zone ci-dessus.'"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted">
          <template v-if="pendingLocal">
            Sélection : <span class="font-medium text-highlighted">{{ pendingLocal.name }}</span>
            <span class="text-muted"> (brouillon)</span>
          </template>
          <template v-else-if="pendingPathname">
            Sélection : <span class="font-medium text-highlighted">{{ pendingPathname.split('/').pop() }}</span>
          </template>
          <template v-else>
            Sélectionnez une image dans la grille
          </template>
        </p>
        <div class="flex gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Utiliser cette image"
            icon="i-lucide-check"
            :disabled="!pendingPathname && !pendingLocal"
            @click="confirmSelection"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
