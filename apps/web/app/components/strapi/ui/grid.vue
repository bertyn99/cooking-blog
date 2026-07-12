<script setup lang="ts">
interface GridItem {
  id: string | number;
  [key: string]: unknown;
}

defineProps<{
  items: GridItem[];
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="(gridItem, index) in items" :key="index" class="p-4 border rounded">
      {{ gridItem }}
    </div>
  </div>
</template>
