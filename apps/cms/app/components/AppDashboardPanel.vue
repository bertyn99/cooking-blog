<script setup lang="ts">
import { DASHBOARD_HEADER_CHROME_CLASS } from '~/utils/dashboard-shell'

defineProps<{
  id?: string
}>()
</script>

<template>
  <UDashboardPanel :id="id">
    <template
      v-if="$slots.header"
      #header
    >
      <div :class="DASHBOARD_HEADER_CHROME_CLASS">
        <slot name="header" />
      </div>
    </template>

    <template #body>
      <slot name="body">
        <slot />
      </slot>
    </template>
  </UDashboardPanel>
</template>
