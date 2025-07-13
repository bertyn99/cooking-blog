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
}

const { content } = defineProps<{ content: any[] }>()

const formattedContent = computed(() =>
  content.map((item) => {
    if (item["__component"] === "ui.text") {
      return { ...item, content: useMarked(item.content) }
    }
    return item
  })
)
</script>

<template>
  <component
    v-for="item in formattedContent"
    :is="componentsMap[item['__component']]"
    v-bind="item"
    :key="item.id"
  />
</template>