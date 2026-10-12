<script setup lang="ts">
import type { EditorNavSection } from '~/types/content-editor'
import { EDITOR_COLUMN_CLASS } from '~/utils/dashboard-shell'

defineProps<{
  sections?: EditorNavSection[]
}>()
</script>

<template>
  <div
    :class="EDITOR_COLUMN_CLASS"
    class="pb-10 pt-2"
  >
    <ContentEditorSectionNav
      v-if="sections?.length"
      :sections="sections"
    />
    <slot />
  </div>
</template>
