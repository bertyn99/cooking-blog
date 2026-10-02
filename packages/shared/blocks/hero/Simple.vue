<script setup lang="ts">
import { catalogEntryForTag, type ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  image?: string
  alt?: string
} & ContentBlockSimpleChromeProps>(), {
  image: '/img/hero.jpg',
  alt: '',
  expanded: false,
})

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()

const heroDef = catalogEntryForTag('hero')

const resolved = computed(() =>
  resolveSectionProps(heroDef.fields, {
    ...props.values,
    image: props.image,
    alt: props.alt,
  }),
)
</script>

<template>
  <BlockSimpleChrome
    tag="hero"
    :values="resolved"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  />
  <BlockHeroClient
    :image="resolved.image"
    :alt="resolved.alt"
    class="mt-2 min-h-[10rem] sm:min-h-[12rem] lg:min-h-[14rem]"
  >
    <template
      v-if="props.slotValues?.title"
      #title
    >
      {{ props.slotValues.title }}
    </template>
    <template
      v-if="props.slotValues?.description"
      #description
    >
      {{ props.slotValues.description }}
    </template>
    <template
      v-if="props.slotValues?.cta"
      #cta
    >
      {{ props.slotValues.cta }}
    </template>
  </BlockHeroClient>
</template>
