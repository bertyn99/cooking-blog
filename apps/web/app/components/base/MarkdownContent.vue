<script lang="ts" setup>
import { sanitizePublicMarkdown } from "~/utils/sanitize-markdown";

const { markdown, tag = "div", variant = "article", fullBleed = false } = defineProps<{
  markdown: string;
  tag?: string;
  class?: string;
  /** `page` enables CMS section blocks; `article` is blog/recipe prose only. */
  variant?: "article" | "page";
  /** Landing sections span the viewport. Prose columns stay for long-form pages. */
  fullBleed?: boolean;
}>();

const safeMarkdown = computed(() => sanitizePublicMarkdown(markdown));
</script>

<template>
  <Suspense>
    <component
      :is="tag"
      v-if="safeMarkdown"
      class="w-full"
      :class="[fullBleed ? 'max-w-none' : 'prose md:prose-lg lg:prose-xl max-w-4xl', $props.class]"
    >
      <BasePageComark v-if="variant === 'page'" :markdown="safeMarkdown" />
      <BaseAppComark v-else :markdown="safeMarkdown" />
    </component>
    <template #fallback>
      <div class="min-h-48 w-full max-w-4xl animate-pulse rounded-md bg-neutral-100" />
    </template>
  </Suspense>
</template>
