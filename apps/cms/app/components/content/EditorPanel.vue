<script setup lang="ts">
defineProps<{
  panelId: string
  title: string
  backTo: string
  backLabel: string
}>()
</script>

<template>
  <AppDashboardPanel :id="panelId">
    <template #header>
      <AppDashboardNavbar :title="title">
        <template #leading>
          <UButton
            :to="backTo"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            class="shrink-0"
            :aria-label="`Retour : ${backLabel}`"
          />
        </template>

        <template #right>
          <ContentEditorToolbarTarget />
        </template>
      </AppDashboardNavbar>
    </template>

    <template #body>
      <slot />
    </template>
  </AppDashboardPanel>
</template>
