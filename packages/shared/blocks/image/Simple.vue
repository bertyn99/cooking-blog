<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  src?: string
  alt?: string
  title?: string
} & ContentBlockSimpleChromeProps>()

const emit = defineEmits<{
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="image"
    :values="props.values ?? { src: props.src, alt: props.alt, title: props.title }"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:values="emit('update:values', $event)"
  >
    <BlockImageClient
      :src="props.src"
      :alt="props.alt"
      :title="props.title"
    />
  </BlockSimpleChrome>
</template>
