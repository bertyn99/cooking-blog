<script lang="ts" setup>
defineProps<{
  quote: string,
  author?: string
}>()
</script>

<template>
  <blockquote class="w-full max-w-3xl mx-auto my-4 p-4 border-l-4 border-gray-400 bg-gray-100 dark:bg-gray-800 dark:border-gray-600">
    <p class="text-lg italic">"{{ quote }}"</p>
    <footer v-if="author" class="text-right mt-2">- {{ author }}</footer>
  </blockquote>
</template>