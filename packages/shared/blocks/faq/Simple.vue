<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import type { JdcFaqItem } from '../../shared/content-blocks/faq'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  items?: string | JdcFaqItem[] | null
} & ContentBlockSimpleChromeProps>(), {
  items: null,
  expanded: false,
})

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="faq"
    :values="props.values ?? { items: typeof props.items === 'string' ? props.items : JSON.stringify(props.items ?? []) }"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  >
    <BlockFaqClient :items="props.items">
      <template
        v-if="props.slotValues?.title?.trim()"
        #title
      >
        {{ props.slotValues.title }}
      </template>
    </BlockFaqClient>
  </BlockSimpleChrome>
</template>
