<script setup lang="ts">
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'
import { uploadMediaFile } from '~/utils/upload-media.client'
import { formatMediaByteSize, isWithinImageUploadLimit, maxImageUploadSizeLabel } from '#shared/media'
import { useDeferredArticleMedia } from '~/composables/useDeferredArticleMedia'

const model = defineModel<string | null>({ required: true })

const props = defineProps<{
  displayName?: string | null
  deferUpload?: boolean
}>()

const deferredMedia = useDeferredArticleMedia()
const deferUpload = computed(() => props.deferUpload ?? Boolean(deferredMedia))

const toast = useToast()
const pickerOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const previewUrl = computed(() => {
  if (deferredMedia?.pendingCoverPreviewUrl.value) {
    return deferredMedia.pendingCoverPreviewUrl.value
  }
  return model.value ? mediaPublicUrl(model.value) : null
})

const fileLabel = computed(() => {
  if (deferredMedia?.pendingCoverPreviewUrl.value && !model.value) {
    return 'Couverture (brouillon)'
  }
  return props.displayName || model.value?.split('/').pop() || 'Aucun fichier'
})

function onPicked(pathname: string) {
  deferredMedia?.clearPendingCover()
  model.value = pathname
}

function onPickedLocal(payload: { previewUrl: string, file: File }) {
  deferredMedia?.setPendingCover(payload)
  model.value = null
}

function openFilePicker() {
  fileInput.value?.click()
}

async function applyPreparedCover(prepared: File) {
  if (deferUpload.value && deferredMedia) {
    const previewUrl = URL.createObjectURL(prepared)
    deferredMedia.setPendingCover({ previewUrl, file: prepared })
    model.value = null
    toast.add({
      title: 'Couverture prête',
      description: 'Envoi à l’enregistrement de l’article.',
      color: 'neutral',
    })
    return
  }

  uploading.value = true
  try {
    model.value = await uploadMediaFile(prepared)
    toast.add({ title: 'Image importée', color: 'success' })
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
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.add({ title: 'Fichier non supporté', description: 'Choisissez une image.', color: 'warning' })
    input.value = ''
    return
  }

  if (!isWithinImageUploadLimit(file.size)) {
    toast.add({
      title: 'Fichier trop volumineux',
      description: `Taille max. ${maxImageUploadSizeLabel()} (fichier : ${formatMediaByteSize(file.size)}).`,
      color: 'warning',
    })
    input.value = ''
    return
  }

  try {
    const prepared = await prepareImageForUpload(file)
    await applyPreparedCover(prepared)
  }
  finally {
    input.value = ''
  }
}

function clearCover() {
  deferredMedia?.clearPendingCover()
  model.value = null
}

function copyPath() {
  if (!model.value) {
    return
  }
  navigator.clipboard.writeText(mediaPublicUrl(model.value))
  toast.add({ title: 'Lien copié', color: 'neutral' })
}
</script>

<template>
  <div class="flex h-full min-h-[12rem] flex-col rounded-lg border border-default bg-elevated/30 p-3">
    <ContentFieldLabel label="cover" />

    <div
      class="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-default bg-default/50"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="fileLabel"
        class="max-h-36 w-full object-cover"
      >
      <div v-else class="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted">
        <UIcon name="i-lucide-image-plus" class="size-8 text-dimmed" />
        <span>Aucune image de couverture</span>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      >
    </div>

    <p class="mt-2 truncate text-xs text-muted" :title="fileLabel">
      {{ fileLabel }}
    </p>

    <div class="mt-2 flex flex-wrap gap-1">
      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="ghost"
        :loading="uploading"
        aria-label="Importer"
        @click="openFilePicker"
      />
      <UButton
        icon="i-lucide-folder-open"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Bibliothèque"
        @click="pickerOpen = true"
      />
      <UButton
        icon="i-lucide-link"
        size="xs"
        color="neutral"
        variant="ghost"
        :disabled="!model && !deferredMedia?.pendingCoverPreviewUrl.value"
        aria-label="Copier le lien"
        @click="copyPath"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="neutral"
        variant="ghost"
        :disabled="!model && !deferredMedia?.pendingCoverPreviewUrl.value"
        aria-label="Supprimer"
        @click="clearCover"
      />
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Remplacer"
        @click="pickerOpen = true"
      />
    </div>

    <ContentMediaPickerModal
      v-model:open="pickerOpen"
      title="Image de couverture"
      :selected-pathname="model"
      :defer-upload="deferUpload"
      @select="onPicked"
      @select-local="onPickedLocal"
    />
  </div>
</template>
