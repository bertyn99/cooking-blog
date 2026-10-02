<script setup lang="ts">
import { PUBLIC_SITE_IMAGES } from '#shared/content-blocks'
import { resolvePreviewMediaSrc } from '~/utils/preview-media'

const props = defineProps<{
  selectedSrc?: string | null
}>()

const emit = defineEmits<{
  select: [src: string]
}>()

const items = computed(() =>
  PUBLIC_SITE_IMAGES.map(item => ({
    ...item,
    preview: resolvePreviewMediaSrc(item.src),
  })),
)
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <button
      v-for="item in items"
      :key="item.src"
      type="button"
      class="overflow-hidden rounded-lg text-left ring-1 transition-shadow"
      :class="selectedSrc === item.src
        ? 'ring-2 ring-primary'
        : 'ring-default hover:ring-primary/40'"
      @click="emit('select', item.src)"
    >
      <img
        :src="item.preview"
        :alt="item.alt"
        class="aspect-4/3 w-full object-cover"
      >
      <div class="space-y-0.5 px-2 py-1.5">
        <p class="truncate text-xs font-medium text-highlighted">
          {{ item.label }}
        </p>
        <p class="truncate font-mono text-[10px] text-muted">
          {{ item.src }}
        </p>
      </div>
    </button>
  </div>
</template>
