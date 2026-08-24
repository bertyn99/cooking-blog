import type { H3Event } from 'nitro/h3'
import { createCalendarQueries, type CalendarQueryOptions } from '../db/queries/calendar'
import type { AppDb } from '../db/create-db'
import { useDb } from '../utils/db'

export type { CalendarQueryOptions }

export function createCalendarService(db: AppDb) {
  const queries = createCalendarQueries(db)
  return {
    listForRange: (opts: CalendarQueryOptions) => queries.listForRange(opts),
  }
}

export function useCalendarService(event?: H3Event) {
  return createCalendarService(useDb(event))
}
