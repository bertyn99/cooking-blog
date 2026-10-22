import { CalendarDate, Time, toCalendarDateTime, toZoned } from '@internationalized/date'
import type { CalendarContentType, CalendarItem } from '#shared/calendar'
import {
  CALENDAR_TIME_ZONE,
  DEFAULT_PUBLISH_HOUR,
  groupCalendarItemsByDay,
  monthRangeFromParts,
  parseCalendarTypesParam,
} from '#shared/calendar'

export interface CalendarFilters {
  types: CalendarContentType[]
  includePublished: boolean
  locale: string
}

export function scheduledAtIsoForDay(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map((part) => Number.parseInt(part, 10))
  const date = new CalendarDate(year!, month!, day!)
  const zoned = toZoned(
    toCalendarDateTime(date, new Time(DEFAULT_PUBLISH_HOUR, 0)),
    CALENDAR_TIME_ZONE
  )
  return zoned.toAbsoluteString()
}

export function usePublishingCalendar() {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const placeholder = shallowRef(
    new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  )

  const filters = reactive<CalendarFilters>({
    types: [...parseCalendarTypesParam(undefined)],
    includePublished: true,
    locale: 'fr',
  })

  const monthRange = computed(() =>
    monthRangeFromParts(placeholder.value.year, placeholder.value.month)
  )

  const { data, status, refresh } = useAsyncData(
    'publishing-calendar',
    () =>
      $api<{ data: CalendarItem[]; backlog: CalendarItem[] }>('/api/admin/calendar', {
        query: {
          from: monthRange.value.from,
          to: monthRange.value.to,
          locale: filters.locale,
          types: filters.types.join(','),
          includePublished: filters.includePublished ? 'true' : 'false',
        },
      }),
    {
      watch: [
        monthRange,
        () => filters.includePublished,
        () => filters.types.join(','),
        () => filters.locale,
      ],
    }
  )

  /**
   * Optimistic overlay for reschedule mutations. Derived read-models stay
   * computeds so SSR renders the same lists the client hydrates with — a
   * `watch(data)` callback does not flush server-side and used to cause
   * hydration mismatches (empty server render vs filled client lists).
   */
  const overlay = shallowRef<{ items?: CalendarItem[]; backlog?: CalendarItem[] }>({})

  const items = computed<CalendarItem[]>(() => overlay.value.items ?? data.value?.data ?? [])
  const backlog = computed<CalendarItem[]>(
    () => overlay.value.backlog ?? data.value?.backlog ?? []
  )

  // Fresh server data wins over any optimistic overlay.
  watch(data, () => {
    overlay.value = {}
  })

  const itemsByDay = computed(() => groupCalendarItemsByDay(items.value))

  const rescheduling = ref(false)

  function itemKey(item: CalendarItem): string {
    return `${item.contentType}:${item.id}`
  }

  function findItem(key: string): CalendarItem | undefined {
    return [...items.value, ...backlog.value].find((entry) => itemKey(entry) === key)
  }

  function replaceItem(updated: CalendarItem) {
    const key = itemKey(updated)
    overlay.value = {
      items: items.value.map((entry) => (itemKey(entry) === key ? updated : entry)),
      backlog: backlog.value.map((entry) => (itemKey(entry) === key ? updated : entry)),
    }
  }

  function upsertOnCalendar(item: CalendarItem) {
    const key = itemKey(item)
    overlay.value = {
      items: [...items.value.filter((entry) => itemKey(entry) !== key), item],
      backlog: backlog.value.filter((entry) => itemKey(entry) !== key),
    }
  }

  async function rescheduleItem(item: CalendarItem, dayKey: string) {
    if (!item.draggable) {
      toast.add({
        title: 'Publication figée',
        description: 'La date d’un contenu déjà publié ne peut pas être modifiée ici.',
        color: 'warning',
      })
      return
    }

    const scheduledAt = scheduledAtIsoForDay(dayKey)
    const previous = { ...item }
    const optimistic: CalendarItem = {
      ...item,
      status: 'scheduled',
      calendarAt: scheduledAt,
      draggable: true,
    }

    upsertOnCalendar(optimistic)
    rescheduling.value = true

    try {
      await $api(`/api/admin/${item.contentType}/${item.id}/schedule`, {
        method: 'POST',
        body: { scheduledAt },
      })

      const scheduledDate = new Date(scheduledAt)
      const isPast = scheduledDate.getTime() < Date.now()
      toast.add({
        title: 'Publication planifiée',
        description: isPast
          ? 'Date dans le passé — sortie au prochain passage du planificateur (≤ 5 min).'
          : `Prévu le ${scheduledDate.toLocaleDateString('fr-FR', { timeZone: CALENDAR_TIME_ZONE })} à ${DEFAULT_PUBLISH_HOUR}h`,
        color: 'success',
      })
    } catch {
      replaceItem(previous)
      if (previous.status === 'draft') {
        overlay.value = {
          items: items.value.filter((entry) => itemKey(entry) !== itemKey(previous)),
          backlog: [...backlog.value, previous],
        }
      }
      toast.add({
        title: 'Erreur',
        description: 'Impossible de replanifier ce contenu.',
        color: 'error',
      })
      await refresh()
    } finally {
      rescheduling.value = false
    }
  }

  return {
    placeholder,
    filters,
    items,
    backlog,
    itemsByDay,
    status,
    rescheduling,
    refresh,
    itemKey,
    findItem,
    rescheduleItem,
  }
}
