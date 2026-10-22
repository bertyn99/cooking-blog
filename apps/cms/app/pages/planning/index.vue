<script setup lang="ts">
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'
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

/** Toolbar month label — « Octobre 2026 » (mirrors the calendar template header). */
const monthLabel = computed(() => {
  const date = placeholder.value.toDate(getLocalTimeZone())
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function shiftMonth(delta: number) {
  placeholder.value = placeholder.value.add({ months: delta })
}

function goToToday() {
  placeholder.value = monthOf(today(getLocalTimeZone()))
}

function monthOf(day: CalendarDate): CalendarDate {
  return new CalendarDate(day.year, day.month, 1)
}

// Keyboard navigation, matching the tooltip hints. Ignored while typing.
function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return
  }
  const target = event.target as HTMLElement | null
  if (
    target?.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
  ) {
    return
  }
  if (event.key === 'ArrowLeft') {
    shiftMonth(-1)
  } else if (event.key === 'ArrowRight') {
    shiftMonth(1)
  } else if (event.key === 't' || event.key === 'T') {
    goToToday()
  } else {
    return
  }
  event.preventDefault()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function openItem(item: { editPath: string }) {
  router.push(item.editPath)
}

function handleReschedule(payload: { key: string; dayKey: string }) {
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
  <AppDashboardPanel id="planning">
    <template #header>
      <AppDashboardNavbar title="Planning" />

      <UDashboardToolbar>
        <template #left>
          <h2 class="text-sm font-semibold text-highlighted tabular-nums">
            {{ monthLabel }}
          </h2>

          <UFieldGroup size="sm">
            <UTooltip text="Mois précédent" :kbds="['arrowleft']">
              <UButton
                icon="i-lucide-chevron-left"
                color="neutral"
                variant="ghost"
                aria-label="Mois précédent"
                @click="shiftMonth(-1)"
              />
            </UTooltip>
            <UTooltip text="Mois suivant" :kbds="['arrowright']">
              <UButton
                icon="i-lucide-chevron-right"
                color="neutral"
                variant="ghost"
                aria-label="Mois suivant"
                @click="shiftMonth(1)"
              />
            </UTooltip>
          </UFieldGroup>

          <UTooltip text="Revenir au mois en cours" :kbds="['t']">
            <UButton
              label="Aujourd'hui"
              color="neutral"
              variant="soft"
              size="sm"
              @click="goToToday"
            />
          </UTooltip>
        </template>

        <template #right>
          <UFormField label="Types de contenu" class="min-w-44">
            <USelectMenu
              v-model="selectedTypes"
              :items="typeFilterOptions"
              value-key="value"
              label-key="label"
              multiple
              placeholder="Tous les types"
              class="w-full min-w-52"
            />
          </UFormField>

          <UFormField label="Affichage">
            <USwitch v-model="filters.includePublished" label="Inclure les contenus publiés" />
          </UFormField>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
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
  </AppDashboardPanel>
</template>
