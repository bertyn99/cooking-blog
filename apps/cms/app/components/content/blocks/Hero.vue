<script setup lang="ts">
import { resolvePreviewMediaSrc } from '~/utils/preview-media'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
}>(), {
  image: '/img/hero.jpg',
})

const src = computed(() => resolvePreviewMediaSrc(props.image))
</script>

<template>
  <div class="relative isolate min-h-[16rem] overflow-hidden sm:min-h-[20rem] lg:min-h-[24rem]">
    <img
      v-if="src"
      :src="src"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
    >
    <div
      v-else
      class="flex min-h-[16rem] items-center justify-center bg-elevated text-sm text-muted"
    >
      Bannière
    </div>
  </div>
</template>
