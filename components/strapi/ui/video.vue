<script lang="ts" setup>
defineProps<{
  src: string,
  width?: number,
  height?: number
}>()
</script>

<template>
  <div class="w-full my-4">
    <iframe
      :src="src"
      :width="width || '560'"
      :height="height || '315'"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</template>