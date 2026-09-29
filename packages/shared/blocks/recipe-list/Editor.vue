<script setup lang="ts">
import type { ContentBlockListQuery } from '../../shared/content-blocks/list'
import { useCanvasEditorProps } from '../../shared/content-editor/canvas-editor'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ContentBlockListQuery>(), {
  source: 'latest',
  limit: '4',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()

const { draft, persist, schedulePersist } = useCanvasEditorProps(
  props,
  ['source', 'category', 'slugs', 'limit'] as const,
  emit,
)

const sourceItems = [
  { label: 'Dernières recettes', value: 'latest' },
  { label: 'Catégorie', value: 'category' },
  { label: 'Slugs', value: 'slugs' },
]
</script>

<template>
  <UCard :ui="{ body: 'space-y-3 p-4' }">
    <p class="text-sm font-medium">
      Liste de recettes
    </p>
    <p class="text-xs text-muted">
      Grille 3/4 comme sur journalducuistot.fr.
    </p>
    <UFormField label="Source">
      <USelect
        v-model="draft.source"
        :items="sourceItems"
        value-key="value"
        @update:model-value="persist"
      />
    </UFormField>
    <UFormField
      v-if="draft.source === 'category'"
      label="Catégorie"
    >
      <UInput
        v-model="draft.category"
        placeholder="slug"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
    <UFormField
      v-if="draft.source === 'slugs'"
      label="Slugs"
    >
      <UInput
        v-model="draft.slugs"
        placeholder="slug-1, slug-2"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
    <UFormField label="Nombre">
      <UInput
        v-model="draft.limit"
        type="number"
        min="1"
        max="24"
        @update:model-value="schedulePersist"
        @blur="persist"
      />
    </UFormField>
  </UCard>
</template>
