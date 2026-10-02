<script setup lang="ts">
import type { ContentBlockListQuery } from '../../shared/content-blocks/list'
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ContentBlockListQuery>(), {
  source: 'latest',
  limit: '5',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('article-list')"
    :values="props"
    @update:values="emit('update:props', $event)"
  />
</template>
