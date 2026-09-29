<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'
import type { ContentBlockListQuery } from '../../shared/content-blocks/list'

defineOptions({ inheritAttrs: false })

defineProps<ContentBlockListQuery>()
</script>

<template>
  <BlockSimpleChrome tag="article-list">
    <BlockArticleListClient v-bind="$props" />
  </BlockSimpleChrome>
</template>
