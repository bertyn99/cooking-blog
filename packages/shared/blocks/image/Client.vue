<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

withDefaults(defineProps<{
  src?: string
  alt?: string
  title?: string
  /** Classes ajoutées à l'img (ex: "max-h-[600px] object-top") */
  class?: string
  /** Largeur de la variante transformée (pipeline /images) */
  width?: string | number
  /** Hauteur de la variante transformée (pipeline /images) */
  height?: string | number
}>(), {
  alt: '',
  title: undefined,
  class: '',
  width: 1300,
  height: 910,
})

const imgClass = computed(() => `jdc-image-block block h-auto w-full max-w-full ${props.class}`.trim())
const widthAttr = computed(() => Number(props.width) || 1300)
const heightAttr = computed(() => Number(props.height) || 910)
</script>

<template>
  <JdcPublicSurface>
    <figure class="jdc-image-block-figure my-4">
      <JdcCoverMedia
        v-if="src"
        :src="src"
        :alt="alt ?? ''"
        :title="title"
        :width="width"
        :height="height"
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

<style>
/* Crop bannière éditorial — en CSS natif : les utilitaires Tailwind des
   defaults JS ne sont pas toujours générés selon le scan. */
.jdc-image-block-figure img.jdc-image-block {
  max-height: 480px;
  object-fit: cover;
  object-position: center;
}
</style>
