<script lang="ts" setup>

import UiText from '@/components/strapi/ui/text.vue'
import UiImage from '@/components/strapi/ui/image.vue'
import UiQuote from '@/components/strapi/ui/quote.vue'
import UiCodeBlock from '@/components/strapi/ui/code-block.vue'
import UiVideo from '@/components/strapi/ui/video.vue'
import UiButton from '@/components/strapi/ui/button.vue'
import UiGallery from '@/components/strapi/ui/gallery.vue'
import UiDivider from '@/components/strapi/ui/divider.vue'
import UiGrid from '@/components/strapi/ui/grid.vue'
import UiCard from '@/components/strapi/ui/card.vue'
import UiBanner from '@/components/strapi/ui/banner.vue'

import type { StrapiContentBlock } from '~/types/strapiMeta'

const componentsMap = {
  'ui.text': UiText,
  'ui.image': UiImage,
  'ui.quote': UiQuote,
  'ui.code-block': UiCodeBlock,
  'ui.video': UiVideo,
  'ui.button': UiButton,
  'ui.gallery': UiGallery,
  'ui.divider': UiDivider,
  'ui.grid': UiGrid,
  'ui.card': UiCard,
  'ui.banner': UiBanner,
} as const

type ComponentKey = keyof typeof componentsMap

const { content } = defineProps<{ content: StrapiContentBlock[] }>()

const formattedContent = computed(() =>
  content.map((item) => {
    if (item.__component === "ui.text") {
      return { ...item, content: item.content || "" }
    }
    return item
  })
)

const resolveComponent = (componentName: string) => {
  return componentsMap[componentName as ComponentKey]
}
</script>

<template>
  <component
    v-for="item in formattedContent"
    :is="resolveComponent(item.__component)"
    v-bind="item"
    :key="item.id"
  />
</template>
