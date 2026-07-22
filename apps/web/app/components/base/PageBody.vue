<script lang="ts" setup>
import type { StrapiContentBlock } from "~/types/strapiMeta";

const { content } = defineProps<{
  content?: string | StrapiContentBlock[] | null;
}>();

const markdown = computed(() => (typeof content === "string" ? content : ""));
const zones = computed(() => (Array.isArray(content) ? content : []));
</script>

<template>
  <MDC
    v-if="markdown"
    class="w-full prose md:prose-lg lg:prose-xl max-w-4xl"
    :value="markdown"
    tag="article"
  />
  <BaseContentDisplay v-else-if="zones.length" :content="zones" />
</template>
