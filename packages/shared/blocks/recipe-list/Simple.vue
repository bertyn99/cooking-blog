<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import type { ContentBlockListQuery } from '../../shared/content-blocks/list'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<ContentBlockListQuery & ContentBlockSimpleChromeProps>()

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="recipe-list"
    :values="props.values ?? props"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  />
  <BlockRecipeListClient
    :source="props.source"
    :category="props.category"
    :slugs="props.slugs"
    :limit="props.limit"
  >
    <template
      v-if="props.slotValues?.title"
      #title
    >
      {{ props.slotValues.title }}
    </template>
  </BlockRecipeListClient>
</template>
