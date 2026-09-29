<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  tag: string
}>()
</script>

<template>
  <div>
    <p class="mb-2 font-mono text-xs text-muted">
      {{ props.tag === 'image' ? 'image' : `::${props.tag}` }}
    </p>
    <slot />
  </div>
</template>
