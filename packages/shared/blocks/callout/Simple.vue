<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  type?: string
} & ContentBlockSimpleChromeProps>(), {
  type: 'info',
  expanded: false,
})

const namedSlotKeys = computed(() =>
  Object.keys(useSlots()).filter(name => name !== 'default'),
)
const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="callout"
    :values="props.values ?? { type: props.type }"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  >
    <BlockCalloutClient :type="props.type">
      <slot />
    </BlockCalloutClient>
    <template
      v-for="name in namedSlotKeys"
      :key="name"
      #[name]
    >
      <slot :name="name" />
    </template>
  </BlockSimpleChrome>
</template>
