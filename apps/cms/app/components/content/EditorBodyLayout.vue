<script setup lang="ts">
import type { EditorNavSection } from '~/types/content-editor'

defineProps<{
  sections?: EditorNavSection[]
}>()
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-2 pb-10 pt-2 sm:px-3">
    <ContentEditorSectionNav
      v-if="sections?.length"
      :sections="sections"
    />
    <slot />
  </div>
</template>
