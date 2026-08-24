<script setup lang="ts">
import { readApiErrorMessage } from '~/utils/media'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'
import { uploadMediaFile } from '~/utils/upload-media.client'
import {
  formatMediaByteSize,
  isWithinImageUploadLimit,
  maxImageUploadSizeLabel,
  MEDIA_GALLERY_PAGE_SIZE,
} from '#shared/media'
import { MEDIA_UPLOAD_ROOT } from '#shared/media-paths'

const props = defineProps<{
  deferUpload?: boolean
  selectOnUpload?: boolean
  selectedPathname?: string | null
  busy?: boolean
}>()

const emit = defineEmits<{
  select: [pathname: string]
  selectLocal: [payload: { previewUrl: string, file: File, name: string }]
  busy: [value: boolean]
  confirm: []
}>()

const { $api } = useNuxtApp()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const search = ref('')
const dragOver = ref(false)
const dropzoneExpanded = ref(false)
const pendingPathname = ref<string | null>(null)
const shakeDropzone = ref(false)

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i

interface MediaBlob {
  pathname: string
  contentType?: string
  size?: number
  originalName?: string
}

interface MediaListResponse {
  blobs: MediaBlob[]
  hasMore: boolean
  cursor?: string
}

const blobs = ref<MediaBlob[]>([])
const hasMore = ref(false)
const cursor = ref<string | undefined>()
const loading = ref(false)
const loadingMore = ref(false)
const galleryScroll = ref<HTMLElement | null>(null)
const loadMoreSentinel = ref<HTMLElement | null>(null)

const reducedMotion = usePreferredReducedMotion()

watch(() => props.selectedPathname, (value) => {
  if (value) {
    pendingPathname.value = value
  }
})

function transferHasFiles(dataTransfer: DataTransfer | null) {
  return dataTransfer?.types.includes('Files') ?? false
}

function fileFromDataTransfer(dataTransfer: DataTransfer | null): File | undefined {
  if (!dataTransfer) return undefined
  if (dataTransfer.files.length > 0) return dataTransfer.files[0]
  for (const item of dataTransfer.items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) return file
    }
  }
  return undefined
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || IMAGE_EXT.test(file.name)
}

async function fetchPage(append: boolean) {
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const res = await $api<MediaListResponse>('/api/media', {
      query: {
        limit: MEDIA_GALLERY_PAGE_SIZE,
        prefix: MEDIA_UPLOAD_ROOT,
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

defineExpose({ refreshGallery, resetSelection: () => { pendingPathname.value = null } })

useMediaGalleryInfiniteScroll(loadMoreSentinel, {
  hasMore,
  loading,
  loadingMore,
  search,
  root: galleryScroll,
  onLoadMore: () => fetchPage(true),
})

const filteredBlobs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return blobs.value
  return blobs.value.filter((blob) => {
    const name = blob.originalName ?? blob.pathname
    return name.toLowerCase().includes(q) || blob.pathname.toLowerCase().includes(q)
  })
})

const hasGalleryItems = computed(() => blobs.value.length > 0)

function openFilePicker() {
  dropzoneExpanded.value = true
  fileInput.value?.click()
}

function nudgeDropzone() {
  if (reducedMotion.value === 'reduce') return
  shakeDropzone.value = true
  window.setTimeout(() => { shakeDropzone.value = false }, 200)
}

async function stageLocalFile(file: File) {
  if (!isImageFile(file)) {
    toast.add({ title: 'Fichier non supporté', description: 'Choisissez une image.', color: 'warning' })
    nudgeDropzone()
    return
  }
  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: `Taille max. ${maxImageUploadSizeLabel()} (fichier : ${formatMediaByteSize(file.size)}).`,
      color: 'warning',
    })
    nudgeDropzone()
    return
  }

  uploading.value = true
  emit('busy', true)
  let shouldConfirm = false
  try {
    const prepared = await prepareImageForUpload(file)
    const previewUrl = URL.createObjectURL(prepared)
    emit('selectLocal', { previewUrl, file: prepared, name: prepared.name })
    toast.add({
      title: 'Image compressée',
      description: 'Elle sera envoyée lors de l’enregistrement de l’article.',
      color: 'neutral',
    })
    shouldConfirm = props.selectOnUpload
  }
  finally {
    uploading.value = false
    emit('busy', false)
    if (shouldConfirm) emit('confirm')
  }
}

async function uploadFile(file: File) {
  if (props.deferUpload) {
    await stageLocalFile(file)
    return
  }
  if (!isImageFile(file)) {
    toast.add({ title: 'Fichier non supporté', description: 'Choisissez une image.', color: 'warning' })
    nudgeDropzone()
    return
  }
  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: `Taille max. ${maxImageUploadSizeLabel()} (fichier : ${formatMediaByteSize(file.size)}).`,
      color: 'warning',
    })
    nudgeDropzone()
    return
  }

  uploading.value = true
  emit('busy', true)
  let shouldConfirm = false
  try {
    const prepared = await prepareImageForUpload(file)
    const pathname = await uploadMediaFile(prepared)
    await refreshGallery()
    pendingPathname.value = pathname
    emit('select', pathname)
    toast.add({ title: 'Image importée', color: 'success' })
    shouldConfirm = props.selectOnUpload
  }
  catch (error: unknown) {
    toast.add({
      title: 'Échec de l\'import',
      description: readApiErrorMessage(error, 'Réessayez ou choisissez un fichier plus léger.'),
      color: 'error',
    })
    nudgeDropzone()
  }
  finally {
    uploading.value = false
    emit('busy', false)
    if (shouldConfirm) emit('confirm')
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await uploadFile(file)
  input.value = ''
}

function onDragEnter(event: DragEvent) {
  if (!transferHasFiles(event.dataTransfer)) return
  event.preventDefault()
  dragOver.value = true
  dropzoneExpanded.value = true
}

function onDragOver(event: DragEvent) {
  if (!transferHasFiles(event.dataTransfer)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  dragOver.value = true
  dropzoneExpanded.value = true
}

function onDragLeave(event: DragEvent) {
  const zone = event.currentTarget as HTMLElement
  const related = event.relatedTarget as Node | null
  if (related && zone.contains(related)) return
  dragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragOver.value = false
  const file = fileFromDataTransfer(event.dataTransfer)
  if (file) void uploadFile(file)
}

function selectPending(pathname: string) {
  pendingPathname.value = pathname
  emit('select', pathname)
}

function formatSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  return `${Math.round(bytes / 1024)} Ko`
}

function displayName(blob: MediaBlob) {
  return blob.originalName ?? blob.pathname.split('/').pop() ?? blob.pathname
}

onMounted(() => {
  void refreshGallery()
})
</script>

<template>
  <div
    class="space-y-3"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange">

    <div
    v-if="dropzoneExpanded || dragOver"
    role="button"
    tabindex="0"
    class="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :class="[
      dragOver ? 'border-primary bg-primary/5 py-8' : 'border-default bg-elevated/30 py-6',
      uploading || busy ? 'pointer-events-none opacity-60' : '',
      shakeDropzone && reducedMotion !== 'reduce' ? 'motion-safe:animate-[shake_0.2s_ease-in-out]' : '',
    ]"
    @click="!uploading && !busy && openFilePicker()"
    @keydown.enter.prevent="!uploading && !busy && openFilePicker()"
    @keydown.space.prevent="!uploading && !busy && openFilePicker()"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <UIcon
      :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-cloud-upload'"
      class="size-8"
      :class="uploading ? 'animate-spin text-muted' : 'text-primary'"
    />
    <span class="text-sm font-medium text-highlighted">
      {{ uploading ? 'Compression…' : 'Glissez une image ici ou cliquez pour parcourir' }}
    </span>
    <span class="text-xs text-muted">
      <template v-if="deferUpload">
        Compression WebP locale — envoi à l’enregistrement
      </template>
      <template v-else>
        JPEG, PNG, WebP, GIF — max. {{ maxImageUploadSizeLabel() }}
      </template>
    </span>
  </div>

  <div
    v-else
    class="flex flex-wrap items-center gap-2 rounded-lg border border-transparent px-1 py-1 transition-colors duration-150"
    :class="dragOver ? 'border-primary bg-primary/5' : ''"
  >
    <UButton
      label="Importer"
      icon="i-lucide-upload"
      color="neutral"
      variant="outline"
      size="sm"
      :loading="uploading"
      :disabled="busy"
      @click="openFilePicker"
    />
    <span class="text-xs text-muted">ou glissez-déposez une image</span>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Rechercher un fichier…"
      class="min-w-[12rem] flex-1"
      :disabled="!hasGalleryItems && !loading"
    />
    <UTooltip text="Actualiser">
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        size="sm"
        :loading="loading"
        aria-label="Actualiser"
        @click="refreshGallery"
      />
    </UTooltip>
  </div>

  <div v-if="loading && !blobs.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
    <USkeleton v-for="index in 8" :key="index" class="aspect-square w-full rounded-lg" />
  </div>

  <div
    v-else-if="filteredBlobs.length"
    ref="galleryScroll"
    class="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-default bg-elevated/20 p-2"
  >
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <button
        v-for="blob in filteredBlobs"
        :key="blob.pathname"
        type="button"
        class="group relative overflow-hidden rounded-lg border-2 text-left transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="pendingPathname === blob.pathname
          ? 'border-primary ring-2 ring-primary/30 scale-[0.98]'
          : 'border-transparent hover:border-default'"
        @click="selectPending(blob.pathname)"
        @dblclick="selectPending(blob.pathname); emit('confirm')"
      >
        <MediaLazyThumb
          :pathname="blob.pathname"
          :alt="displayName(blob)"
          variant="picker"
          :scroll-root="galleryScroll"
          img-class="aspect-square w-full object-cover"
        />
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1.5 pt-6 opacity-0 transition-opacity duration-120 group-hover:opacity-100 group-focus-visible:opacity-100"
          :class="pendingPathname === blob.pathname ? '!opacity-100' : ''"
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
          class="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow transition-transform duration-120"
        >
          <UIcon name="i-lucide-check" class="size-3.5" />
        </div>
      </button>
    </div>
    <div
      v-if="hasMore && !search"
      ref="loadMoreSentinel"
      class="flex min-h-6 justify-center py-2"
      aria-hidden="true"
    >
      <UIcon
        v-if="loadingMore"
        name="i-lucide-loader-circle"
        class="size-4 animate-spin text-muted"
        aria-label="Chargement de fichiers supplémentaires"
      />
    </div>
  </div>

  <UAlert
    v-if="!loading && !filteredBlobs.length"
    color="neutral"
    variant="subtle"
    icon="i-lucide-images"
    :title="search ? 'Aucun résultat' : 'Médiathèque vide'"
    :description="search
      ? 'Essayez un autre terme ou importez une nouvelle image.'
      : 'Importez votre première image avec le bouton ci-dessus.'"
  />
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
