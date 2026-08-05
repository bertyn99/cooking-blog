<script lang="ts" setup>
import { sanitizePublicMarkdown } from "~/utils/sanitize-markdown";

const { markdown, tag = "div" } = defineProps<{
  markdown: string;
  tag?: string;
  class?: string;
}>();

const safeMarkdown = computed(() => sanitizePublicMarkdown(markdown));
</script>

<template>
  <Suspense>
    <component
      :is="tag"
      v-if="safeMarkdown"
      class="w-full prose md:prose-lg lg:prose-xl max-w-4xl"
      :class="$props.class"
    >
      <BaseAppComark :markdown="safeMarkdown" />
    </component>
  </Suspense>
</template>
