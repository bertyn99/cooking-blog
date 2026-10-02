<script lang="ts" setup>
const { content, fullBleed = false } = defineProps<{
  content?: string | null;
  fullBleed?: boolean;
}>();

const markdown = computed(() =>
  typeof content === "string" && content.length > 0 ? content : "",
);
</script>

<template>
  <BaseMarkdownContent
    v-if="markdown"
    :markdown="markdown"
    tag="article"
    variant="page"
    :full-bleed="fullBleed"
  />
</template>
