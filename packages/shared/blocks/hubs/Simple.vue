<script setup lang="ts">
import { catalogEntryForTag, type ContentBlockSimpleChromeProps } from '../../shared/content-blocks/catalog'
import { resolveSectionProps } from '../../shared/content-blocks/schema'
import BlockSimpleChrome from '../../app/components/BlockSimpleChrome.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  recipesHref?: string
  techniquesHref?: string
  africaHref?: string
  journalHref?: string
} & ContentBlockSimpleChromeProps>(), {
  recipesHref: '/recette',
  techniquesHref: '/techniques-culinaires',
  africaHref: '/recettes-du-monde',
  journalHref: '/blog',
  expanded: false,
})

const emit = defineEmits<{
  'update:slotValues': [Record<string, string>]
  'update:values': [Record<string, string>]
}>()

const def = catalogEntryForTag('hubs')

const resolved = computed(() =>
  resolveSectionProps(def.fields, {
    ...props.values,
    recipesHref: props.recipesHref,
    techniquesHref: props.techniquesHref,
    africaHref: props.africaHref,
    journalHref: props.journalHref,
  }),
)
</script>

<template>
  <BlockSimpleChrome
    tag="hubs"
    :values="resolved"
    :expanded="props.expanded"
    :slot-values="props.slotValues"
    @update:slot-values="emit('update:slotValues', $event)"
    @update:values="emit('update:values', $event)"
  />
  <BlockHubsClient
    :recipes-href="resolved.recipesHref"
    :techniques-href="resolved.techniquesHref"
    :africa-href="resolved.africaHref"
    :journal-href="resolved.journalHref"
  >
    <template
      v-if="props.slotValues?.title"
      #title
    >
      {{ props.slotValues.title }}
    </template>
  </BlockHubsClient>
</template>
