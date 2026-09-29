<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  type?: string
}>(), {
  type: 'info',
})
</script>

<template>
  <BlockSimpleChrome tag="callout">
    <BlockCalloutClient v-bind="$props">
      <slot />
    </BlockCalloutClient>
  </BlockSimpleChrome>
</template>
