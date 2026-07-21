export const CALENDAR_CONTENT_TYPES = ['articles', 'recipes', 'pages'] as const

export type CalendarContentType = (typeof CALENDAR_CONTENT_TYPES)[number]

export type CalendarContentStatus = 'draft' | 'published' | 'scheduled'

export interface CalendarItem {
  id: number
  contentType: CalendarContentType
  title: string
  status: CalendarContentStatus
  calendarAt: string | null
  draggable: boolean
  editPath: string
}

export const CALENDAR_TIME_ZONE = 'Europe/Paris'

export const DEFAULT_PUBLISH_HOUR = 9

export function isCalendarContentType(value: string): value is CalendarContentType {
  return (CALENDAR_CONTENT_TYPES as readonly string[]).includes(value)
}

export function resolveCalendarAt(
  status: CalendarContentStatus,
  scheduledAt: string | null,
  publishedAt: string | null,
): string | null {
  if (status === 'scheduled' && scheduledAt) {
    return scheduledAt
  }
  if (status === 'published' && publishedAt) {
    return publishedAt
  }
  return null
}

export function isCalendarItemDraggable(status: CalendarContentStatus): boolean {
  return status === 'scheduled' || status === 'draft'
}

export function calendarDayKeyFromIso(
  iso: string,
  timeZone: string = CALENDAR_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function calendarDayKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function monthRangeFromParts(year: number, month: number): { from: string, to: string } {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    from: calendarDayKeyFromParts(year, month, 1),
    to: calendarDayKeyFromParts(year, month, lastDay),
  }
}

export function groupCalendarItemsByDay(
  items: CalendarItem[],
  timeZone: string = CALENDAR_TIME_ZONE,
): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>()

  for (const item of items) {
    if (!item.calendarAt) {
      continue
    }
    const key = calendarDayKeyFromIso(item.calendarAt, timeZone)
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(item)
    }
    else {
      map.set(key, [item])
    }
  }

  for (const bucket of map.values()) {
    bucket.sort((a, b) => (a.calendarAt ?? '').localeCompare(b.calendarAt ?? ''))
  }

  return map
}

export function parseCalendarTypesParam(
  raw: string | undefined,
): CalendarContentType[] {
  if (!raw?.trim()) {
    return [...CALENDAR_CONTENT_TYPES]
  }

  const types = raw
    .split(',')
    .map(part => part.trim())
    .filter(isCalendarContentType)

  return types.length > 0 ? types : [...CALENDAR_CONTENT_TYPES]
}

export function calendarRangeBounds(from: string, to: string): { fromIso: string, toIso: string } {
  return {
    fromIso: `${from}T00:00:00.000Z`,
    toIso: `${to}T23:59:59.999Z`,
  }
}
