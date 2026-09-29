<script setup lang="ts">
import { PreviewMarkdown } from '~/utils/markdown/preview-markdown'

defineProps<{
  markdown: string
}>()
</script>

<template>
  <div class="cms-markdown-preview min-h-[20rem] w-full max-w-none px-4 py-4 sm:px-5">
    <PreviewMarkdown
      v-if="markdown.trim()"
      :value="markdown"
    />
    <p
      v-else
      class="text-sm text-muted"
    >
      Rien à prévisualiser.
    </p>
  </div>
</template>
