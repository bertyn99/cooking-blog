<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
}>(), {
  image: '/img/hero.jpg',
})
</script>

<template>
  <JdcPublicSurface>
    <div class="relative isolate min-h-[28rem] overflow-hidden sm:min-h-[32rem] lg:min-h-[36rem]">
      <JdcCoverMedia
        v-if="props.image"
        :src="props.image"
        alt=""
        :width="1920"
        :height="1080"
        sizes="sm:100vw md:100vw lg:100vw xl:100vw"
        img-class="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div class="mx-auto max-w-7xl px-14 py-32 sm:py-48 lg:py-56">
        <slot />
      </div>
    </div>
  </JdcPublicSurface>
</template>
