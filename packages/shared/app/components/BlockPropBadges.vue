<script setup lang="ts">
import type { ContentBlockField } from '../../shared/content-blocks/catalog'
import {
  propCountLabel,
  uniqueFieldKinds,
  visibleFields,
} from '../../shared/content-blocks/schema'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  fields: ContentBlockField[]
  values?: Record<string, string | number | boolean | undefined>
}>(), {
  values: () => ({}),
})

const visible = computed(() => visibleFields(props.fields, props.values))
const kinds = computed(() => uniqueFieldKinds(visible.value))
</script>

<template>
  <div
    v-if="visible.length"
    class="flex min-w-0 flex-wrap items-center gap-1"
  >
    <UBadge
      color="neutral"
      variant="subtle"
      size="xs"
      :label="propCountLabel(visible.length)"
    />
    <UBadge
      v-for="kind in kinds"
      :key="kind.kind"
      color="neutral"
      variant="outline"
      size="xs"
      :icon="kind.icon"
      :label="kind.label"
    />
  </div>
</template>
