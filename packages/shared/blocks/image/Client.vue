<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  src?: string
  alt?: string
  title?: string
}>()
</script>

<template>
  <JdcPublicSurface>
    <figure class="my-4">
      <JdcCoverMedia
        v-if="src"
        :src="src"
        :alt="alt ?? ''"
        :title="title"
        :width="1300"
        :height="910"
        img-class="block h-auto w-full max-w-full object-cover object-center max-h-[480px]"
      />
      <figcaption
        v-if="alt"
        class="mt-2 text-sm text-neutral-500"
      >
        {{ alt }}
      </figcaption>
    </figure>
  </JdcPublicSurface>
</template>
