<script setup lang="ts">
const props = defineProps<{
  resourceLabel: string
  resourceTo: string
  title?: string
  subtitle?: string
  loading?: boolean
}>()

const breadcrumbCurrent = computed(() => {
  if (props.loading) {
    return 'Chargement…'
  }
  if (props.subtitle) {
    return props.subtitle
  }
  return props.title || 'Sans titre'
})
</script>

<template>
  <AppDashboardPanel>
    <template #header>
      <AppDashboardNavbar :toggle="false">
          <template #leading>
            <UButton
              :to="resourceTo"
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="`Retour aux ${resourceLabel.toLowerCase()}`"
            />

            <nav
              class="flex min-w-0 items-center gap-1.5 text-sm"
              aria-label="Fil d'Ariane"
            >
              <NuxtLink
                :to="resourceTo"
                class="shrink-0 text-muted transition-colors hover:text-default"
              >
                {{ resourceLabel }}
              </NuxtLink>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-3.5 shrink-0 text-dimmed"
                aria-hidden="true"
              />
              <span
                class="truncate font-medium text-default"
                :title="breadcrumbCurrent"
              >
                {{ breadcrumbCurrent }}
              </span>
            </nav>
          </template>

          <template #right>
            <ContentEditorToolbarTarget />
          </template>
        </AppDashboardNavbar>

        <ContentEditorSectionNavTarget />
    </template>

    <template #body>
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center gap-3 py-20 text-muted"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-7 animate-spin"
        />
        <p class="text-sm">
          Chargement du contenu…
        </p>
      </div>

      <slot v-else />
    </template>
  </AppDashboardPanel>
</template>
