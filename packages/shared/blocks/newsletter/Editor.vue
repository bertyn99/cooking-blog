<script setup lang="ts">
import { catalogEntryForTag } from '../../shared/content-blocks/catalog'

defineOptions({ inheritAttrs: false })

const emptyValues: Record<string, string | number | boolean> = {}

const emit = defineEmits<{
  'update:props': [Record<string, string>]
}>()
</script>

<template>
  <BlockPropsForm
    :definition="catalogEntryForTag('newsletter')"
    :values="emptyValues"
    @update:values="emit('update:props', $event)"
  />
</template>
