<script setup lang="ts">
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'
</script>

<template>
  <div :class="[DASHBOARD_SURFACE_CLASS, 'p-4 sm:p-5']">
    <slot />
  </div>
</template>
