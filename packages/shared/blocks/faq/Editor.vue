<script setup lang="ts">
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  items?: string
}>(), {
  items: '',
})

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('faq')"
    :values="props"
    @update:values="emit('update:props', $event)"
  />
</template>
