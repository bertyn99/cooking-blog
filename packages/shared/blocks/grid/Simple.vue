<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  cols?: string | number
}>(), {
  cols: 2,
})
</script>

<template>
  <BlockSimpleChrome tag="grid">
    <BlockGridClient v-bind="$props">
      <slot />
    </BlockGridClient>
  </BlockSimpleChrome>
</template>
