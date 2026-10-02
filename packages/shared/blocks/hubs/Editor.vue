<script setup lang="ts">
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  recipesHref?: string
  techniquesHref?: string
  africaHref?: string
  journalHref?: string
}>(), {
  recipesHref: '/recette',
  techniquesHref: '/techniques-culinaires',
  africaHref: '/recettes-du-monde',
  journalHref: '/blog',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('hubs')"
    :values="props"
    @update:values="emit('update:props', $event)"
  />
</template>
