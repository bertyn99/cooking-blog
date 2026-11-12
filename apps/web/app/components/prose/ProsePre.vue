<template>
  <pre v-bind="props">
    <slot />
  </pre>
</template>

<script setup lang="ts">
const props = defineProps<{
  code?: string;
  language?: string | null;
  filename?: string | null;
  highlights?: number[];
  meta?: string | null;
  class?: string | null;
}>();
</script>

<style>
pre code .line {
  display: block;
}
</style>
