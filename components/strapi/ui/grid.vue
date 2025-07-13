<script setup lang="ts">
// Define a specific item type instead of using `any`
interface GridItem {
  id: string | number;
  [key: string]: any;
}

defineProps<{
  // Array of grid items with unique identifiers
  items: GridItem[]
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