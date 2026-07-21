import { describe, expect, it } from 'vitest'
import {
  calendarDayKeyFromIso,
  calendarDayKeyFromParts,
  groupCalendarItemsByDay,
  isCalendarItemDraggable,
  monthRangeFromParts,
  parseCalendarTypesParam,
  resolveCalendarAt,
} from '../../shared/calendar'
import type { CalendarItem } from '../../shared/calendar'

describe('calendar helpers', () => {
  it('resolveCalendarAt prefers scheduledAt for scheduled content', () => {
    expect(resolveCalendarAt('scheduled', '2026-07-20T07:00:00.000Z', null)).toBe('2026-07-20T07:00:00.000Z')
    expect(resolveCalendarAt('published', null, '2026-07-01T07:00:00.000Z')).toBe('2026-07-01T07:00:00.000Z')
    expect(resolveCalendarAt('draft', null, null)).toBeNull()
  })

  it('isCalendarItemDraggable blocks published items', () => {
    expect(isCalendarItemDraggable('published')).toBe(false)
    expect(isCalendarItemDraggable('scheduled')).toBe(true)
    expect(isCalendarItemDraggable('draft')).toBe(true)
  })

  it('groups items by Europe/Paris calendar day', () => {
    const items: CalendarItem[] = [{
      id: 1,
      contentType: 'articles',
      title: 'Test',
      status: 'scheduled',
      calendarAt: '2026-07-20T07:00:00.000Z',
      draggable: true,
      editPath: '/articles/1',
    }]

    const map = groupCalendarItemsByDay(items)
    expect(map.get(calendarDayKeyFromIso('2026-07-20T07:00:00.000Z'))?.[0]?.id).toBe(1)
  })

  it('parses calendar type filters', () => {
    expect(parseCalendarTypesParam('articles,recipes')).toEqual(['articles', 'recipes'])
    expect(parseCalendarTypesParam('invalid')).toHaveLength(3)
  })

  it('builds month ranges', () => {
    expect(monthRangeFromParts(2026, 7)).toEqual({
      from: '2026-07-01',
      to: '2026-07-31',
    })
    expect(calendarDayKeyFromParts(2026, 7, 4)).toBe('2026-07-04')
  })
})
