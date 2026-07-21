<script setup lang="ts">
const model = defineModel<string | null>({ required: true })

const props = defineProps<{
  displayName?: string | null
}>()

const { $api } = useNuxtApp()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const pickerOpen = ref(false)
const uploading = ref(false)

const previewUrl = computed(() =>
  model.value ? `/images/${model.value}` : null,
)

const fileLabel = computed(() =>
  props.displayName || model.value?.split('/').pop() || 'Aucun fichier',
)

interface MediaListResponse {
  blobs: { pathname: string, mimeType?: string }[]
}

const { data: mediaList, refresh: refreshMedia } = await useAsyncData(
  'cover-picker-media',
  () => $api<MediaListResponse>('/api/media', { query: { limit: 48 } }),
  { immediate: false },
)

watch(pickerOpen, (open) => {
  if (open) {
    refreshMedia()
  }
})

function openFilePicker() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const uploaded = await $api<{ pathname: string }>('/api/media', {
      method: 'POST',
      body: formData,
    })
    model.value = uploaded.pathname
    toast.add({ title: 'Image importée', color: 'success' })
  }
  catch {
    toast.add({ title: 'Échec de l\'import', color: 'error' })
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

function selectFromLibrary(pathname: string) {
  model.value = pathname
  pickerOpen.value = false
}

function clearCover() {
  model.value = null
}

function copyPath() {
  if (!model.value) {
    return
  }
  navigator.clipboard.writeText(`/images/${model.value}`)
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
        :disabled="!model"
        aria-label="Remplacer"
        @click="openFilePicker"
      />
    </div>

    <UModal v-model:open="pickerOpen" title="Choisir une image">
      <template #body>
        <div class="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
          <button
            v-for="blob in mediaList?.blobs ?? []"
            :key="blob.pathname"
            type="button"
            class="overflow-hidden rounded-md border border-default ring-primary transition hover:ring-2"
            :class="model === blob.pathname ? 'ring-2 ring-primary' : ''"
            @click="selectFromLibrary(blob.pathname)"
          >
            <img
              :src="`/images/${blob.pathname}`"
              :alt="blob.pathname"
              class="aspect-square w-full object-cover"
            >
          </button>
        </div>
        <p v-if="!(mediaList?.blobs?.length)" class="py-8 text-center text-sm text-muted">
          Aucun média. Importez un fichier avec le bouton +.
        </p>
      </template>
    </UModal>
  </div>
</template>
