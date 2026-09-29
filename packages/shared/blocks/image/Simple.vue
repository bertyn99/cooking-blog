<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  src?: string
  alt?: string
  title?: string
}>()
</script>

<template>
  <BlockSimpleChrome tag="image">
    <BlockImageClient v-bind="$props" />
  </BlockSimpleChrome>
</template>
