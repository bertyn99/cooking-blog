<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  title?: string
  /** Classes ajoutées à l'img (ex: "max-h-[600px] object-cover object-top") */
  class?: string
  /** Largeur de la variante transformée (pipeline /images) */
  width?: string | number
  /** Hauteur de la variante transformée (pipeline /images) */
  height?: string | number
}>(), {
  alt: '',
  title: undefined,
  class: 'object-cover object-center max-h-[480px]',
  width: 1300,
  height: 910,
})

const widthAttr = computed(() => Number(props.width) || 1300)
const heightAttr = computed(() => Number(props.height) || 910)
const imgClass = computed(() => `block h-auto w-full max-w-full ${props.class}`.trim())
</script>

<template>
  <JdcPublicSurface>
    <figure class="my-4">
      <JdcCoverMedia
        v-if="src"
        :src="src"
        :alt="alt"
        :title="title"
        :width="widthAttr"
        :height="heightAttr"
        :img-class="imgClass"
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
