<script lang="ts" setup>
defineProps<{
  // Array of grid items; extend this type as needed.
  items: any[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="(gridItem, index) in items" :key="index" class="p-4 border rounded">
      <!-- Render grid item content -->
      {{ gridItem }}
    </div>
  </div>
</template>