<script lang="ts" setup>
defineProps<{
  image: { url: string; alternativeText: string },
  caption?: string
}>()
</script>

<template>
  <figure class="w-full max-w-3xl mx-auto my-4">
    <img :src="image.url" :alt="image.alternativeText" class="rounded-lg w-full" />
    <figcaption v-if="caption" class="text-center text-sm text-gray-500 mt-2">
      {{ caption }}
    </figcaption>
  </figure>
</template>