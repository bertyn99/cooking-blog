<script lang="ts" setup>
defineProps<{
  message: string,
  // A string for background color classes (e.g., 'bg-blue-500') or other styling props.
  background: string
}>()
</script>

<template>
  <div :class="['p-6 text-center', background]">
    <h2 class="text-2xl font-semibold">{{ message }}</h2>
  </div>
</template>