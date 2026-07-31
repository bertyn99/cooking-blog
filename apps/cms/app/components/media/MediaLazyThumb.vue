<script setup lang="ts">
import type { MediaLazyThumbVariant } from '~/composables/useLazyMediaThumbnail'

const props = withDefaults(defineProps<{
  pathname: string
  alt?: string
  variant?: MediaLazyThumbVariant
  /** Parent with `overflow-y-auto` (picker modal). */
  scrollRoot?: HTMLElement | null
  imgClass?: string
}>(), {
  alt: '',
  variant: 'thumb',
  imgClass: 'size-full object-cover',
})

const scrollRootRef = computed(() => props.scrollRoot ?? null)

const { target, src } = useLazyMediaThumbnail(
  () => props.pathname,
  {
    variant: props.variant,
    root: scrollRootRef,
    rootMargin: props.variant === 'picker' ? '80px' : '120px',
  },
)
</script>

<template>
  <div
    ref="target"
    class="size-full min-h-0 min-w-0"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="imgClass"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    >
    <USkeleton
      v-else
      class="size-full rounded-none"
    />
  </div>
</template>
