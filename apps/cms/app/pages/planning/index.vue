<script setup lang="ts">
import type { CalendarContentType } from '#shared/calendar'
import { CALENDAR_CONTENT_TYPES } from '#shared/calendar'

const router = useRouter()

const {
  placeholder,
  filters,
  itemsByDay,
  backlog,
  status,
  rescheduling,
  findItem,
  rescheduleItem,
} = usePublishingCalendar()

const typeFilterOptions = [
  { label: 'Articles', value: 'articles' as CalendarContentType },
  { label: 'Recettes', value: 'recipes' as CalendarContentType },
  { label: 'Pages', value: 'pages' as CalendarContentType },
]

const selectedTypes = computed({
  get: () => filters.types,
  set: (value: CalendarContentType[]) => {
    filters.types = value.length > 0 ? value : [...CALENDAR_CONTENT_TYPES]
  },
})

function openItem(item: { editPath: string }) {
  router.push(item.editPath)
}

function handleReschedule(payload: { key: string, dayKey: string }) {
  const item = findItem(payload.key)
  if (!item) {
    return
  }
  if (!item.draggable) {
    return
  }
  rescheduleItem(item, payload.dayKey)
}
</script>

<template>
  <UDashboardPanel id="planning">
    <template #header>
      <UDashboardNavbar title="Planning">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        class="mb-4 flex flex-wrap items-end gap-3"
      >
        <UFormField label="Types de contenu" class="min-w-48">
          <USelectMenu
            v-model="selectedTypes"
            :items="typeFilterOptions"
            value-key="value"
            label-key="label"
            multiple
            placeholder="Tous les types"
            class="w-full min-w-56"
          />
        </UFormField>

        <UFormField label="Affichage" class="min-w-48">
          <USwitch
            v-model="filters.includePublished"
            label="Inclure les contenus publiés"
          />
        </UFormField>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_minmax(16rem,20rem)]">
        <PlanningPublishingCalendar
          v-model:placeholder="placeholder"
          :items-by-day="itemsByDay"
          :loading="status === 'pending' || rescheduling"
          @open="openItem"
          @reschedule="handleReschedule"
        />

        <PlanningCalendarBacklog
          :items="backlog"
          :loading="status === 'pending'"
          @open="openItem"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
