<script lang="ts" setup>
import type { Article } from "~/types/strapiMeta";

defineProps({
  articles: {
    type: Array as PropType<Article[]>,
    required: true,
  },
});
</script>

<template>
  <div class="space-y-20 lg:space-y-20 px-2">
    <template v-for="article in articles" :key="article.id">
      <ArticleCard :post="article" />
    </template>
  </div>
</template>
