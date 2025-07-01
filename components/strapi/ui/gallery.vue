<script lang="ts" setup>
defineProps<{
  images: Array<{ url: string; alternativeText: string }>
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
    <div v-for="(img, index) in images" :key="index">
      <img :src="img.url" :alt="img.alternativeText" class="w-full h-auto rounded" />
    </div>
  </div>
</template>