<script setup lang="ts">
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
  alt?: string
  ctaHref?: string
  ctaSecondaryHref?: string
}>(), {
  image: '/img/hero.jpg',
  alt: '',
  ctaHref: '/recette',
  ctaSecondaryHref: '/blog',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('hero')"
    :values="props"
    @update:values="emit('update:props', $event)"
  />
</template>
