<script setup lang="ts">
import { useCanvasEditorProps } from '../../shared/content-editor/canvas-editor'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
}>(), {
  image: '/img/hero.jpg',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()

const { draft, persist, schedulePersist } = useCanvasEditorProps(
  props,
  ['image'] as const,
  emit,
)
</script>

<template>
  <UCard :ui="{ body: 'space-y-3 p-4' }">
    <p class="text-sm font-medium">
      Bannière
    </p>
    <p class="text-xs text-muted">
      Grande image d’accroche, comme sur le site.
    </p>
    <UFormField label="Image">
      <UInput
        v-model="draft.image"
        placeholder="/img/hero.jpg"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
  </UCard>
</template>
