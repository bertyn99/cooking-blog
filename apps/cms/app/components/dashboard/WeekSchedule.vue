<script setup lang="ts">
import type { CalendarContentType } from '#shared/calendar'
import { calendarDayKeyFromIso, CALENDAR_TIME_ZONE } from '#shared/calendar'
import type { CalendarItem } from '#shared/calendar'
import { DASHBOARD_STATUS_LABELS } from '#shared/dashboard'
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'

const props = defineProps<{
  week: { from: string, to: string }
  items: CalendarItem[]
}>()

function formatWeekLabel() {
  const from = new Date(`${props.week.from}T12:00:00.000Z`)
  const to = new Date(`${props.week.to}T12:00:00.000Z`)
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt.format(from)} – ${fmt.format(to)}`
}

function typeMeta(contentType: CalendarContentType) {
  switch (contentType) {
    case 'articles':
      return { icon: 'i-lucide-newspaper', label: 'Article', color: 'primary' as const }
    case 'recipes':
      return { icon: 'i-lucide-utensils', label: 'Recette', color: 'warning' as const }
    case 'pages':
      return { icon: 'i-lucide-file-text', label: 'Page', color: 'info' as const }
  }
}

function statusColor(status: CalendarItem['status']) {
  switch (status) {
    case 'published':
      return 'success' as const
    case 'scheduled':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function dayHeading(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: CALENDAR_TIME_ZONE,
  })
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CALENDAR_TIME_ZONE,
  })
}

const grouped = computed(() => {
  const map = new Map<string, CalendarItem[]>()
  for (const item of props.items) {
    if (!item.calendarAt) {
      continue
    }
    const key = calendarDayKeyFromIso(item.calendarAt, CALENDAR_TIME_ZONE)
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(item)
    }
    else {
      map.set(key, [item])
    }
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
})
</script>

<template>
  <section :class="[DASHBOARD_SURFACE_CLASS, 'flex h-full flex-col']">
    <div class="flex items-start justify-between gap-2 border-b border-default/70 px-4 py-3">
      <div>
        <h2 class="text-sm font-semibold text-highlighted">
          Cette semaine
        </h2>
        <p class="mt-0.5 text-xs text-muted">
          {{ formatWeekLabel() }}
        </p>
      </div>
      <UButton
        to="/planning"
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-calendar-days"
        label="Planning"
        class="shrink-0 max-sm:hidden"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-if="items.length === 0"
        class="rounded-lg border border-dashed border-default px-3 py-8 text-center text-sm text-muted"
      >
        Rien de planifié ni publié cette semaine.
      </div>

      <ul v-else class="space-y-4">
        <li v-for="[dayKey, dayItems] in grouped" :key="dayKey">
          <p class="mb-2 text-xs font-medium capitalize text-muted">
            {{ dayHeading(dayItems[0]!.calendarAt!) }}
          </p>
          <ul class="space-y-1.5">
            <li v-for="item in dayItems" :key="`${item.contentType}:${item.id}`">
              <NuxtLink
                :to="item.editPath"
                class="flex items-center gap-2 rounded-md border border-default/70 px-2.5 py-2 text-sm transition hover:bg-elevated/50"
              >
                <UIcon :name="typeMeta(item.contentType).icon" class="size-4 shrink-0 text-dimmed" />
                <span class="min-w-0 flex-1 truncate text-highlighted">{{ item.title }}</span>
                <span class="hidden shrink-0 text-xs text-muted sm:inline">
                  {{ timeLabel(item.calendarAt!) }}
                </span>
                <UBadge :color="statusColor(item.status)" variant="subtle" size="sm" class="shrink-0">
                  {{ DASHBOARD_STATUS_LABELS[item.status] }}
                </UBadge>
              </NuxtLink>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>
