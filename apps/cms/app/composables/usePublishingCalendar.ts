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
  const [year, month, day] = dayKey.split('-').map(part => Number.parseInt(part, 10))
  const date = new CalendarDate(year, month, day)
  const zoned = toZoned(
    toCalendarDateTime(date, new Time(DEFAULT_PUBLISH_HOUR, 0)),
    CALENDAR_TIME_ZONE,
  )
  return zoned.toAbsoluteString()
}

export function usePublishingCalendar() {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const placeholder = shallowRef(new CalendarDate(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
  ))

  const filters = reactive<CalendarFilters>({
    types: [...parseCalendarTypesParam(undefined)],
    includePublished: true,
    locale: 'fr',
  })

  const monthRange = computed(() =>
    monthRangeFromParts(placeholder.value.year, placeholder.value.month),
  )

  const { data, status, refresh } = useAsyncData(
    'publishing-calendar',
    () => $api<{ data: CalendarItem[], backlog: CalendarItem[] }>('/api/admin/calendar', {
      query: {
        from: monthRange.value.from,
        to: monthRange.value.to,
        locale: filters.locale,
        types: filters.types.join(','),
        includePublished: filters.includePublished ? 'true' : 'false',
      },
    }),
    { watch: [monthRange, () => filters.includePublished, () => filters.types.join(','), () => filters.locale] },
  )

  const items = shallowRef<CalendarItem[]>([])
  const backlog = shallowRef<CalendarItem[]>([])

  watch(data, (value) => {
    items.value = value?.data ?? []
    backlog.value = value?.backlog ?? []
  }, { immediate: true })

  const itemsByDay = computed(() => groupCalendarItemsByDay(items.value))

  const rescheduling = ref(false)

  function itemKey(item: CalendarItem): string {
    return `${item.contentType}:${item.id}`
  }

  function findItem(key: string): CalendarItem | undefined {
    return [...items.value, ...backlog.value].find(entry => itemKey(entry) === key)
  }

  function replaceItem(updated: CalendarItem) {
    const key = itemKey(updated)
    const inData = items.value.findIndex(entry => itemKey(entry) === key)
    if (inData >= 0) {
      const next = [...items.value]
      next[inData] = updated
      items.value = next
      return
    }
    const inBacklog = backlog.value.findIndex(entry => itemKey(entry) === key)
    if (inBacklog >= 0) {
      const next = [...backlog.value]
      next[inBacklog] = updated
      backlog.value = next
    }
  }

  function removeFromBacklog(item: CalendarItem) {
    backlog.value = backlog.value.filter(entry => itemKey(entry) !== itemKey(item))
  }

  function upsertOnCalendar(item: CalendarItem) {
    removeFromBacklog(item)
    const key = itemKey(item)
    const without = items.value.filter(entry => itemKey(entry) !== key)
    items.value = [...without, item]
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
    }
    catch {
      replaceItem(previous)
      if (previous.status === 'draft') {
        backlog.value = [...backlog.value, previous]
        items.value = items.value.filter(entry => itemKey(entry) !== itemKey(previous))
      }
      toast.add({
        title: 'Erreur',
        description: 'Impossible de replanifier ce contenu.',
        color: 'error',
      })
      await refresh()
    }
    finally {
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
