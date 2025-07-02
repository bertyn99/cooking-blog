<script lang="ts" setup>
defineProps<{
  images: Array<{ url: string; alternativeText: string }>
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
    <div v-for="img in images" :key="img.url">
      <nuxt-img
        :src="img.url"
        :alt="img.alternativeText"
        class="w-full h-auto rounded"
        loading="lazy"
        sizes="sm:50vw md:25vw"
      />
    </div>
  </div>
  </div>
</template>