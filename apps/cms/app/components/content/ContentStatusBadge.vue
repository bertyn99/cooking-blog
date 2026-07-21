<script setup lang="ts">
import { contentStatusBadgeColor, contentStatusLabel } from '~/utils/content-status'

const props = defineProps<{
  status: string
}>()

const label = computed(() => contentStatusLabel(props.status))
const color = computed(() => contentStatusBadgeColor(props.status))
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
  >
    {{ label }}
  </UBadge>
</template>
