<script setup lang="ts">
import type { ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<ContentBlockSimpleChromeProps>()

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()
</script>

<template>
  <BlockSimpleChrome
    tag="newsletter"
    :values="props.values ?? {}"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  >
    <BlockNewsletterClient>
      <template
        v-if="props.slotValues?.title?.trim()"
        #title
      >
        {{ props.slotValues.title }}
      </template>
      <template
        v-if="props.slotValues?.subtitle?.trim()"
        #subtitle
      >
        {{ props.slotValues.subtitle }}
      </template>
      <template
        v-if="props.slotValues?.button?.trim()"
        #button
      >
        {{ props.slotValues.button }}
      </template>
    </BlockNewsletterClient>
  </BlockSimpleChrome>
</template>
