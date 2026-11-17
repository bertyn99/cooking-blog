<script lang="ts" setup>
import type { Recipe } from "~/types/strapiMeta";

const { list, showDetails, full, feedAfter } = defineProps<{
  list: Recipe[];
  showDetails?: boolean;
  full?: boolean;
  /** 0-based card index after which to insert the in-feed unit. */
  feedAfter?: number;
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
      <template v-for="(recipe, index) in list" :key="recipe?.id || recipe?.title">
        <RecipeCard :recipe="recipe" :details="showDetails" />
        <AdsFeed
          v-if="feedAfter !== undefined && index === feedAfter && list.length > feedAfter"
          placement="feedRecipes"
          dense
        />
      </template>
    </div>
  </div>
</template>
