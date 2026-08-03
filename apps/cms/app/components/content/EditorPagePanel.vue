<script setup lang="ts">
defineProps<{
  panelId: string
  title: string
  backTo: string
  subtitle?: string
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
            aria-label="Retour à la liste"
          />
        </template>

        <template #right>
          <ContentEditorToolbarTarget />
        </template>
      </AppDashboardNavbar>

      <p
        v-if="subtitle"
        class="truncate px-2 pb-2 text-xs text-muted sm:px-3"
      >
        {{ subtitle }}
      </p>
    </template>

    <template #body>
      <slot />
    </template>
  </AppDashboardPanel>
</template>
