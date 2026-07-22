<script lang="ts" setup>
import type { StrapiContentBlock } from "~/types/strapiMeta";

const { content } = defineProps<{
  content?: string | StrapiContentBlock[] | null;
}>();

const markdown = computed(() => (typeof content === "string" ? content : ""));
const zones = computed(() => (Array.isArray(content) ? content : []));
</script>

<template>
  <BaseMarkdownContent v-if="markdown" :markdown="markdown" tag="article" />
  <BaseContentDisplay v-else-if="zones.length" :content="zones" />
</template>
