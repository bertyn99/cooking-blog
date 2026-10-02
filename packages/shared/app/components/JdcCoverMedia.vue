<script setup lang="ts">
import { buildPublicDeliveryImagePath, toPublicMediaKey } from '../../shared/media-delivery-path'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  title?: string
  width?: number
  height?: number
  sizes?: string
  imgClass?: string
  priority?: boolean
}>(), {
  alt: '',
  width: 800,
  height: 600,
  priority: false,
})

const NuxtImg = resolveComponent('NuxtImg')
const hasNuxtImg = typeof NuxtImg !== 'string'

const isStaticOrRemote = computed(() => {
  const src = props.src || ''
  return src.startsWith('/img/')
    || src.startsWith('blob:')
    || /^(https?:)?\/\//.test(src)
})

const resolvedStaticSrc = computed(() => {
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

const publicKey = computed(() => {
  const src = props.src || ''
  if (!src) return ''
  if (src.startsWith('/images/')) {
    const idx = src.lastIndexOf('/')
    return src.slice(idx + 1)
  }
  return toPublicMediaKey(src)
})

const useOptimizedCmsImage = computed(() =>
  hasNuxtImg && Boolean(props.src) && !isStaticOrRemote.value,
)

const imgSrc = computed(() => {
  if (!props.src) return ''
  if (isStaticOrRemote.value) return resolvedStaticSrc.value
  if (useOptimizedCmsImage.value) return publicKey.value
  return buildPublicDeliveryImagePath(props.src, {
    width: props.width,
    height: props.height,
    fit: 'cover',
    format: 'webp',
  })
})

const imgBind = computed(() => {
  if (useOptimizedCmsImage.value) {
    return {
      provider: 'localImageSharp',
      format: 'webp',
      fit: 'cover',
      ...(props.priority ? { preload: { fetchPriority: 'high' as const } } : {}),
    }
  }
  return props.priority ? { fetchpriority: 'high' } : {}
})
</script>

<template>
  <component
    :is="useOptimizedCmsImage ? NuxtImg : 'img'"
    v-if="src && imgSrc"
    :src="imgSrc"
    :alt="alt"
    :title="title"
    :width="width"
    :height="height"
    :sizes="sizes"
    :loading="priority ? 'eager' : 'lazy'"
    :class="imgClass"
    v-bind="imgBind"
  />
</template>
