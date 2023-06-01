<script lang="ts" setup>
const { list } = defineProps({
  list: {
    type: Array,
    required: true,
  },
});
console.log(list);
</script>

<template>
  <div class="mx-auto max-w-6xl px-2 sm:px-4 lg:px-6 py-1">
    <div
      role="list"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <RecipeCard
        v-for="recipe in list"
        :key="recipe?.id || recipe?.title"
        :recipe="recipe"
      ></RecipeCard>
    </div>
  </div>
</template>
