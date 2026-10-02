<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import type { ContentBlockListQuery } from '../../shared/content-blocks/list'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<ContentBlockListQuery & ContentBlockSimpleChromeProps>()

const emit = defineEmits<{
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="article-list"
    :values="props.values ?? props"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:values="emit('update:values', $event)"
  >
    <BlockArticleListClient
      :source="props.source"
      :category="props.category"
      :slugs="props.slugs"
      :limit="props.limit"
    />
  </BlockSimpleChrome>
</template>
