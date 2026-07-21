<script setup lang="ts">
import { mergeDashboardNavbarUi } from '~/utils/dashboard-shell'

const props = withDefaults(
  defineProps<{
    title?: string
    toggle?: boolean
    showSidebarCollapse?: boolean
    ui?: Record<string, string | undefined>
  }>(),
  {
    toggle: true,
    showSidebarCollapse: true,
  },
)

const navbarUi = computed(() => mergeDashboardNavbarUi(props.ui))
</script>

<template>
  <UDashboardNavbar
    :title="title"
    :toggle="toggle"
    :ui="navbarUi"
  >
    <template
      v-if="showSidebarCollapse || $slots.leading"
      #leading
    >
      <div class="flex min-w-0 items-center gap-0.5">
        <UDashboardSidebarCollapse v-if="showSidebarCollapse" />
        <slot name="leading" />
      </div>
    </template>

    <template
      v-if="$slots.title"
      #title
    >
      <slot name="title" />
    </template>

    <template
      v-if="$slots.right"
      #right
    >
      <slot name="right" />
    </template>

    <template
      v-if="$slots.trailing"
      #trailing
    >
      <slot name="trailing" />
    </template>

    <template
      v-if="$slots.default"
      #default
    >
      <slot />
    </template>
  </UDashboardNavbar>
</template>
