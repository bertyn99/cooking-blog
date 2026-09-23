<script lang="ts" setup>
const { content } = defineProps<{
  content?: string | null;
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
  />
</template>
