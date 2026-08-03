<script setup lang="ts">
import { mediaCoverPreviewUrl, mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'
import { uploadMediaFile } from '~/utils/upload-media.client'
import { formatMediaByteSize, isWithinImageUploadLimit, maxImageUploadSizeLabel } from '#shared/media'
import { useDeferredArticleMedia } from '~/composables/useDeferredArticleMedia'

const model = defineModel<string | null>({ required: true })
const coverAltText = defineModel<string | null>('coverAltText', { default: null })
const coverDescription = defineModel<string | null>('coverDescription', { default: null })

const props = defineProps<{
  displayName?: string | null
  deferUpload?: boolean
  compact?: boolean
  contentTitle?: string
}>()

const deferredMedia = useDeferredArticleMedia()
const deferUpload = computed(() => props.deferUpload ?? Boolean(deferredMedia))

const toast = useToast()
const pickerOpen = ref(false)
const accessibilityOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const canEditAccessibility = computed(() =>
  Boolean(model.value || deferredMedia?.pendingCoverPreviewUrl.value),
)

const previewUrl = computed(() => {
  if (deferredMedia?.pendingCoverPreviewUrl.value) {
    return deferredMedia.pendingCoverPreviewUrl.value
  }
  return model.value ? mediaCoverPreviewUrl(model.value) : null
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
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-default"
    :class="compact ? 'h-full' : ''"
  >
    <ContentFieldLabel label="cover" />

    <div
      class="flex flex-col gap-3"
      :class="compact ? '' : 'sm:flex-row sm:items-start'"
    >
      <div
        class="relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-default bg-elevated/40"
        :class="compact
          ? 'mx-auto aspect-square w-full max-w-[11rem]'
          : previewUrl
            ? 'size-28'
            : 'min-h-[5.5rem] w-full sm:size-28'"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="fileLabel"
          class="size-full object-cover"
        >
        <div
          v-else
          class="flex flex-col items-center gap-1 px-2 py-3 text-center text-xs text-muted"
        >
          <UIcon
            name="i-lucide-image-plus"
            class="size-6 text-dimmed"
          />
          <span>Aucune image</span>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onFileChange"
        >
      </div>

      <div
        class="min-w-0 space-y-2"
        :class="compact ? 'text-center' : 'flex-1'"
      >
        <p
          class="text-sm leading-snug text-default"
          :class="compact ? '' : 'truncate'"
          :title="fileLabel"
        >
          {{ previewUrl || deferredMedia?.pendingCoverPreviewUrl.value ? fileLabel : 'Pas de couverture' }}
        </p>
        <p class="text-xs text-muted">
          JPG, PNG ou WebP
        </p>

        <div
          class="flex flex-wrap gap-1"
          :class="compact ? 'justify-center' : ''"
        >
          <UButton
            size="xs"
            variant="soft"
            icon="i-lucide-upload"
            :label="compact ? undefined : 'Importer'"
            aria-label="Importer une image"
            :loading="uploading"
            @click="openFilePicker"
          />
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-folder-open"
            :label="compact ? undefined : 'Bibliothèque'"
            aria-label="Ouvrir la bibliothèque"
            @click="pickerOpen = true"
          />
          <UButton
            v-if="canEditAccessibility"
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-captions"
            :label="compact ? undefined : 'Alt / description'"
            aria-label="Modifier l’alt et la description de couverture"
            @click="accessibilityOpen = true"
          />
          <UButton
            v-if="canEditAccessibility"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash-2"
            aria-label="Supprimer"
            @click="clearCover"
          />
        </div>
      </div>
    </div>

    <ContentMediaPickerModal
      v-model:open="pickerOpen"
      title="Image de couverture"
      :selected-pathname="model"
      :defer-upload="deferUpload"
      @select="onPicked"
      @select-local="onPickedLocal"
    />

    <UModal
      v-model:open="accessibilityOpen"
      title="Accessibilité de la couverture"
      description="Laissez vide pour reprendre les valeurs du fichier média (import Strapi)."
    >
      <template #body>
        <ContentCoverAccessibilityFields
          v-model:cover-blob-pathname="model"
          v-model:cover-alt-text="coverAltText"
          v-model:cover-description="coverDescription"
          :content-title="props.contentTitle"
          :allow-deferred="Boolean(deferredMedia?.pendingCoverPreviewUrl.value)"
        />
      </template>
    </UModal>
  </div>
</template>
