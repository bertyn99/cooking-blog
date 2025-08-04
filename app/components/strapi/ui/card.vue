<script lang="ts" setup>
defineProps<{
  title: string,
  content: string
}>()
</script>

<template>
  <div class="bg-white shadow rounded p-4">
    <h3 class="text-lg font-bold">{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>