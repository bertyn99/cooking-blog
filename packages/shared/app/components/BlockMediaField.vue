<script setup lang="ts">
import { JdcMediaPickerKey } from '../utils/jdc-media-picker'

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })

const props = defineProps<{
  placeholder?: string
  alt?: string
  /** When clearing, restore catalog default (e.g. `/img/hero.jpg`). */
  resetValue?: string
}>()

const emit = defineEmits<{
  'update:alt': [string]
}>()

const picker = inject(JdcMediaPickerKey, null)

const previewSrc = computed(() => {
  const src = model.value.trim()
  if (!src) return ''
  return picker?.preview(src) ?? src
})

const fileLabel = computed(() => {
  const src = model.value.trim()
  if (!src) return 'Aucune image'
  return src.split('/').pop() || src
})

async function choose() {
  if (!picker) return
  const result = await picker.pick({ src: model.value, alt: props.alt })
  if (!result) return
  model.value = result.src
  if (result.alt != null && result.alt !== '') {
    emit('update:alt', result.alt)
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <div class="size-14 shrink-0 overflow-hidden rounded-md bg-elevated ring-1 ring-default">
        <img
          v-if="previewSrc"
          :src="previewSrc"
          :alt="alt || ''"
          class="size-full object-cover"
        >
        <div
          v-else
          class="flex size-full items-center justify-center text-muted"
        >
          <UIcon
            name="i-lucide-image"
            class="size-5"
          />
        </div>
      </div>
      <div class="min-w-0 flex-1 space-y-1">
        <p class="truncate font-mono text-[11px] text-muted">
          {{ fileLabel }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="picker"
            size="xs"
            variant="soft"
            icon="i-lucide-folder-open"
            label="Choisir"
            @click.stop="choose"
          />
          <UButton
            v-if="model"
            size="xs"
            color="neutral"
            variant="ghost"
            label="Retirer"
            @click.stop="model = resetValue?.trim() || ''"
          />
        </div>
      </div>
    </div>
    <UInput
      v-if="!picker"
      :model-value="model"
      :placeholder="placeholder"
      icon="i-lucide-image"
      @update:model-value="model = String($event ?? '')"
    />
  </div>
</template>
