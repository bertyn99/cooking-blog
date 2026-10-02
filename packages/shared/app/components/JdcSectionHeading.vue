<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <USeparator
    v-if="$slots.default"
    position="start"
    size="xs"
    color="neutral"
    :ui="{
      root: 'mb-12',
      container: 'me-4',
      label: 'jdc-serif text-2xl font-normal text-highlighted',
      border: 'border-default',
    }"
  >
    <h2 class="jdc-serif m-0 text-2xl leading-8 font-normal text-highlighted">
      <slot />
    </h2>
  </USeparator>
</template>
