<script setup lang="ts">
import { catalogEntryForTag, type ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
  alt?: string
  href?: string
} & ContentBlockSimpleChromeProps>(), {
  image: '/img/author.jpg',
  alt: 'Portrait du cuistot',
  href: '/a-propos',
  expanded: false,
})

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()

const def = catalogEntryForTag('person')

const resolved = computed(() =>
  resolveSectionProps(def.fields, {
    ...props.values,
    image: props.image,
    alt: props.alt,
    href: props.href,
  }),
)
</script>

<template>
  <BlockSimpleChrome
    tag="person"
    :values="resolved"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  />
  <BlockPersonClient
    :image="resolved.image"
    :alt="resolved.alt"
    :href="resolved.href"
  >
    <template
      v-if="props.slotValues?.heading"
      #heading
    >
      {{ props.slotValues.heading }}
    </template>
    <template
      v-if="props.slotValues?.body"
      #body
    >
      {{ props.slotValues.body }}
    </template>
    <template
      v-if="props.slotValues?.cta"
      #cta
    >
      {{ props.slotValues.cta }}
    </template>
  </BlockPersonClient>
</template>
