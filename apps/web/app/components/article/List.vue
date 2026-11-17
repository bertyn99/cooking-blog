<script lang="ts" setup>
import type { Article } from "~/types/strapiMeta";

const { articles, feedAfter } = defineProps<{
  articles: Article[];
  /** 0-based card index after which to insert the in-feed unit. */
  feedAfter?: number;
}>();
</script>

<template>
  <div class="space-y-20 lg:space-y-20 px-2">
    <template v-for="(article, index) in articles" :key="article.id">
      <ArticleCard :post="article" />
      <AdsFeed
        v-if="feedAfter !== undefined && index === feedAfter && articles.length > feedAfter"
        placement="feedArticles"
      />
    </template>
  </div>
</template>
