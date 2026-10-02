<script lang="ts" setup>
import { PageMarkdown as ComarkRoot } from "~/utils/markdown/page-markdown";

defineProps<{
  markdown: string;
  class?: string;
}>();
</script>

<template>
  <ComarkRoot :value="markdown" :class="class" />
</template>
