<script lang="ts" setup>
const { content } = defineProps<{
  content: string
}>()
</script>

<template>
  <MDC class="w-full prose md:prose-lg max-w-3xl px-1" :value="content" tag="div"></MDC>
</template>