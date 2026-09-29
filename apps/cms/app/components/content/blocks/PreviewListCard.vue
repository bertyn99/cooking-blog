<script setup lang="ts">
import { resolvePreviewMediaSrc } from '~/utils/preview-media'
import type { PreviewListItem } from '~/composables/usePreviewBlockList'

const props = defineProps<{
  item: PreviewListItem
}>()

const src = computed(() => resolvePreviewMediaSrc(props.item.coverBlobPathname))
</script>

<template>
  <article class="overflow-hidden rounded-lg border border-default bg-default">
    <div class="aspect-[4/3] bg-elevated">
      <img
        v-if="src"
        :src="src"
        :alt="item.title"
        class="h-full w-full object-cover"
      >
    </div>
    <p class="truncate px-3 py-2 text-sm font-medium">
      {{ item.title }}
    </p>
  </article>
</template>
