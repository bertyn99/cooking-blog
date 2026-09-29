<script setup lang="ts">
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <BlockSimpleChrome tag="newsletter">
    <BlockNewsletterClient />
  </BlockSimpleChrome>
</template>
