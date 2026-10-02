<script lang="ts" setup>
import { ArticleMarkdown as ComarkRoot } from "~/utils/markdown/article-markdown";

defineProps<{
  markdown: string;
  class?: string;
}>();
</script>

<template>
  <ComarkRoot :value="markdown" :class="class" />
</template>
