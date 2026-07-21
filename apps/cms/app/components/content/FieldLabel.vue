<script setup lang="ts">
import { contentFieldLabel } from '~/utils/content-field-labels'

const props = withDefaults(defineProps<{
  label: string
  hint?: string
  count?: number
  size?: 'field' | 'section'
}>(), {
  size: 'field',
})

const displayLabel = computed(() => contentFieldLabel(props.label))
</script>

<template>
  <div class="mb-1.5 flex items-baseline gap-2">
    <span
      class="font-medium"
      :class="size === 'section'
        ? 'text-sm text-default'
        : 'text-xs font-medium text-muted'"
    >
      {{ displayLabel }}<span
        v-if="count !== undefined"
        class="text-dimmed"
      > ({{ count }})</span>
    </span>
    <span
      v-if="hint"
      class="text-[11px] text-dimmed"
    >{{ hint }}</span>
  </div>
</template>
