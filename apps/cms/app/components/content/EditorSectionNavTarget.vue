<script setup lang="ts">
import { CONTENT_EDITOR_SECTION_NAV_ID } from '~/utils/content-editor-toolbar'
import { EDITOR_COLUMN_CLASS } from '~/utils/dashboard-shell'
</script>

<template>
  <div
    :id="CONTENT_EDITOR_SECTION_NAV_ID"
    :class="EDITOR_COLUMN_CLASS"
    class="min-h-0"
  />
</template>
