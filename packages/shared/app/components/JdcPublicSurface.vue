<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div
    class="jdc-public isolate"
    data-theme="light"
    data-color-mode="light"
  >
    <slot />
  </div>
</template>

<style>
.jdc-public {
  color-scheme: light;
  color: #111827;
  font-family: Catamaran, ui-sans-serif, system-ui, sans-serif;
}

.jdc-public .jdc-serif {
  font-family: Merriweather, ui-serif, Georgia, serif;
}
</style>
