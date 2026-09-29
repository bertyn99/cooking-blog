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

const nuxtApp = useNuxtApp()
const hasNuxtImage = computed(() => '$img' in nuxtApp)

const tag = computed(() => {
  if (!hasNuxtImage.value) return 'img'
  const nuxtImg = resolveComponent('NuxtImg')
  return typeof nuxtImg === 'string' ? 'img' : nuxtImg
})

const resolvedSrc = computed(() => {
  const src = props.src || ''
  if (!src.startsWith('/img/')) return src
  const site = String(useRuntimeConfig().public.siteUrl || '').replace(/\/$/, '')
  if (!site || !import.meta.client) return src
  try {
    const siteOrigin = new URL(site, window.location.origin).origin
    if (siteOrigin !== window.location.origin) return `${site}${src}`
  }
  catch {
    return src
  }
  return src
})

const imageProvider = computed(() => {
  const src = resolvedSrc.value
  if (!src || !hasNuxtImage.value) return undefined
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
    :src="resolvedSrc"
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
