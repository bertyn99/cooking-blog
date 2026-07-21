<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
  count?: number
}>()
</script>

<template>
  <div class="mb-1.5 flex items-baseline gap-2">
    <span class="text-xs font-medium tracking-wide text-muted lowercase">
      {{ label }}<span v-if="count !== undefined" class="text-dimmed"> ({{ count }})</span>
    </span>
    <span v-if="hint" class="text-[11px] text-dimmed">{{ hint }}</span>
  </div>
</template>
