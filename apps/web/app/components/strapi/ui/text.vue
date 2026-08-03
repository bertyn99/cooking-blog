<script lang="ts" setup>
const { content } = defineProps<{
  content: string
}>()
</script>

<template>
  <BaseMarkdownContent :markdown="content" class="max-w-3xl px-1" />
</template>