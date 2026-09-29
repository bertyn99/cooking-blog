<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  title?: string
  width?: number
  height?: number
  sizes?: string
  imgClass?: string
}>(), {
  alt: '',
  width: 800,
  height: 600,
})

const nuxtImg = resolveComponent('NuxtImg')
const tag = computed(() => (typeof nuxtImg === 'string' ? 'img' : nuxtImg))

/** Public `/img` and CMS `/images` URLs stay as-is; web media keys use localImageSharp. */
const imageProvider = computed(() => {
  const src = props.src
  if (!src || typeof nuxtImg === 'string') return undefined
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('blob:')) {
    return undefined
  }
  return 'localImageSharp'
})
</script>

<template>
  <component
    :is="tag"
    v-if="src"
    :src="src"
    :alt="alt"
    :title="title"
    :width="width"
    :height="height"
    :sizes="sizes"
    :provider="imageProvider"
    :format="imageProvider ? 'webp' : undefined"
    loading="lazy"
    :class="imgClass"
  />
</template>
