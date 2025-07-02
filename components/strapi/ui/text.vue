<script lang="ts" setup>
defineProps<{
  content: string
}>()
</script>

<template>
  <div class="w-full prose md:prose-lg max-w-3xl px-1" v-html="content"></div>
</template>