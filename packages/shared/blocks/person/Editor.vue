<script setup lang="ts">
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
  alt?: string
  href?: string
}>(), {
  image: '/img/author.jpg',
  alt: 'Portrait du cuistot',
  href: '/a-propos',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('person')"
    :values="props"
    @update:values="emit('update:props', $event)"
  />
</template>
