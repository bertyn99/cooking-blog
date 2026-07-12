<script lang="ts" setup>
import type { Recipe } from "~/types/strapiMeta";

const { list, showDetails, full } = defineProps<{
  list: Recipe[];
  showDetails?: boolean;
  full?: boolean;
}>();
</script>

<template>
  <div
    class="mx-auto max-w-6xl py-1"
    :class="[!full ? '' : 'px-2 sm:px-4 lg:px-6']"
  >
    <div
      role="list"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4"
    >
      <RecipeCard
        v-for="recipe in list"
        :key="recipe?.id || recipe?.title"
        :recipe="recipe"
        :details="showDetails"
      ></RecipeCard>
    </div>
  </div>
</template>
