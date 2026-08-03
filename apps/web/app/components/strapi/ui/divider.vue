<script lang="ts" setup>
defineProps<{
  thickness?: string,
  color?: string
}>()
</script>

<template>
  <hr :class="[thickness ? thickness : 'border', color ? color : 'border-gray-300']" />
</template>