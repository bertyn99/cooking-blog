<script setup lang="ts">
import { readApiErrorMessage, mediaPublicUrl } from '~/utils/media'
import type { ImageAspectRatio, ImageGenerationModel, IngestResponse } from '~/types/media-picker'

const emit = defineEmits<{
  generated: [pathname: string]
  busy: [value: boolean, label?: string]
}>()

const { $api } = useNuxtApp()
const toast = useToast()

const prompt = ref('')
const aspectRatio = ref<ImageAspectRatio>('4:3')
const model = ref<ImageGenerationModel>('google/nano-banana-2')
const optionsOpen = ref(false)
const generating = ref(false)
const errorMessage = ref<string | null>(null)
const previewPathname = ref<string | null>(null)

let abortController: AbortController | null = null

const reducedMotion = usePreferredReducedMotion()

const aspectOptions: { label: string, value: ImageAspectRatio }[] = [
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
]

const modelOptions: { label: string, value: ImageGenerationModel }[] = [
  { label: 'Nano Banana', value: 'google/nano-banana-2' },
  { label: 'Seedream', value: 'bytedance/seedream-5-pro' },
]

const canGenerate = computed(() => prompt.value.trim().length > 0 && !generating.value)

const previewUrl = computed(() =>
  previewPathname.value ? mediaPublicUrl(previewPathname.value) : null,
)

function abort() {
  abortController?.abort()
  abortController = null
  generating.value = false
  emit('busy', false)
}

function reset() {
  abort()
  prompt.value = ''
  aspectRatio.value = '4:3'
  model.value = 'google/nano-banana-2'
  optionsOpen.value = false
  errorMessage.value = null
  previewPathname.value = null
}

async function generate() {
  const text = prompt.value.trim()
  if (!text || generating.value) return

  errorMessage.value = null
  generating.value = true
  emit('busy', true, 'Génération…')
  abortController = new AbortController()

  try {
    const result = await $api<IngestResponse>('/api/media/generate', {
      method: 'POST',
      body: {
        prompt: text,
        aspectRatio: aspectRatio.value,
        model: model.value,
      },
      signal: abortController.signal,
    })

    previewPathname.value = result.pathname
    emit('generated', result.pathname)
    emit('busy', false)
    toast.add({
      title: result.duplicate ? 'Image déjà en bibliothèque' : 'Image générée',
      description: result.usedFallback ? 'Modèle de secours utilisé.' : undefined,
      color: 'success',
    })
  }
  catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage.value = 'Génération annulée.'
      return
    }
    errorMessage.value = readApiErrorMessage(error, 'La génération a échoué. Réessayez.')
    toast.add({
      title: 'Échec de la génération',
      description: errorMessage.value,
      color: 'error',
    })
  }
  finally {
    generating.value = false
    abortController = null
    emit('busy', false)
  }
}

defineExpose({
  reset,
  abort,
  isGenerating: () => generating.value,
})
</script>

<template>
  <div class="space-y-3">
    <UTextarea
      v-model="prompt"
      :rows="4"
      placeholder="Ex. plat de pâtes au pesto, lumière naturelle, vue de dessus"
      :disabled="generating"
      autoresize
    />

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      :title="errorMessage"
    />

    <div class="flex flex-wrap items-center gap-2">
      <UButton
        label="Options"
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="generating"
        @click="optionsOpen = !optionsOpen"
      />
      <UButton
        v-if="!generating"
        label="Générer"
        icon="i-lucide-sparkles"
        color="primary"
        :disabled="!canGenerate"
        @click="generate"
      />
      <UButton
        v-else
        label="Arrêter"
        icon="i-lucide-square"
        color="neutral"
        variant="outline"
        @click="abort"
      />
    </div>

    <div
      v-if="optionsOpen"
      class="space-y-3 overflow-hidden rounded-lg border border-default bg-elevated/20 p-3 transition-all duration-180"
    >
      <div>
        <p class="mb-2 text-xs font-medium text-muted">
          Format
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in aspectOptions"
            :key="opt.value"
            :label="opt.label"
            size="xs"
            :color="aspectRatio === opt.value ? 'primary' : 'neutral'"
            :variant="aspectRatio === opt.value ? 'solid' : 'outline'"
            :disabled="generating"
            @click="aspectRatio = opt.value"
          />
        </div>
      </div>
      <div>
        <p class="mb-2 text-xs font-medium text-muted">
          Modèle
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="opt in modelOptions"
            :key="opt.value"
            :label="opt.label"
            size="xs"
            :color="model === opt.value ? 'primary' : 'neutral'"
            :variant="model === opt.value ? 'solid' : 'outline'"
            :disabled="generating"
            @click="model = opt.value"
          />
        </div>
      </div>
    </div>

    <div
      class="flex min-h-[10rem] items-center justify-center overflow-hidden rounded-lg border border-dashed border-default bg-elevated/30"
      :aria-busy="generating"
    >
      <img
        v-if="previewUrl && !generating"
        :src="previewUrl"
        alt="Aperçu de l’image générée"
        class="max-h-[min(16rem,40vh)] w-full object-contain transition-opacity duration-200"
        :class="reducedMotion === 'reduce' ? '' : 'motion-safe:opacity-100'"
      >
      <div
        v-else-if="generating"
        class="flex w-full flex-col items-center gap-2 p-6"
      >
        <USkeleton
          class="h-40 w-full max-w-md rounded-lg"
          :class="reducedMotion === 'reduce' ? '' : 'motion-safe:animate-pulse'"
        />
        <p class="text-xs text-muted">
          Génération en cours…
        </p>
      </div>
      <p v-else class="px-4 text-center text-xs text-muted">
        L’aperçu apparaîtra ici après génération
      </p>
    </div>
  </div>
</template>
