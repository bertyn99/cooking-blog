<script setup lang="ts">
import { mediaPublicUrl, readApiErrorMessage } from '~/utils/media'
import { prepareImageForUpload } from '~/utils/prepare-image-upload.client'
import { formatMediaByteSize, isWithinImageUploadLimit, maxImageUploadSizeLabel } from '#shared/media'

const model = defineModel<string | null>({ required: true })

const props = defineProps<{
  displayName?: string | null
}>()

const toast = useToast()
const pickerOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const { $api } = useNuxtApp()
const uploading = ref(false)

const previewUrl = computed(() =>
  model.value ? mediaPublicUrl(model.value) : null,
)

const fileLabel = computed(() =>
  props.displayName || model.value?.split('/').pop() || 'Aucun fichier',
)

function onPicked(pathname: string) {
  model.value = pathname
}

function openFilePicker() {
  fileInput.value?.click()
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

  uploading.value = true
  try {
    const prepared = await prepareImageForUpload(file)
    const formData = new FormData()
    formData.append('file', prepared)
    const uploaded = await $api<{ pathname: string }>('/api/media', {
      method: 'POST',
      body: formData,
    })
    model.value = uploaded.pathname
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
    input.value = ''
  }
}

function clearCover() {
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
        :disabled="!model"
        aria-label="Copier le lien"
        @click="copyPath"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="neutral"
        variant="ghost"
        :disabled="!model"
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
      @select="onPicked"
    />
  </div>
</template>
