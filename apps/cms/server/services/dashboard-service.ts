import type { H3Event } from 'nitro/h3'
import type { AppDb } from '../db/create-db'
import { createDbQueries, type DbQueries } from '../db/queries'
import type { CalendarItem } from '../../shared/calendar'
import { CALENDAR_CONTENT_TYPES, isoWeekRange } from '../../shared/calendar'
import type { DashboardSummary } from '../../shared/dashboard'
import { createCalendarService } from './calendar-service'
import { getStrapiImportStatus } from './strapi-import-status'
import { useDb } from '../utils/db'

export function createDashboardService(db: AppDb) {
  const queries = createDbQueries(db)
  const calendar = createCalendarService(db)
  return {
    buildSummary: (
      event: Parameters<typeof getStrapiImportStatus>[0],
      locale: string,
    ) => buildDashboardSummary(queries, calendar, event, locale),
  }
}

export function useDashboardService(event?: H3Event) {
  return createDashboardService(useDb(event))
}

async function buildDashboardSummary(
  queries: DbQueries,
  calendar: ReturnType<typeof createCalendarService>,
  event: Parameters<typeof getStrapiImportStatus>[0],
  locale: string,
): Promise<DashboardSummary> {
  const week = isoWeekRange()

  const [
    pipeline,
    counts,
    calendarResult,
    backlog,
    recentlyUpdated,
    health,
    lastPublished,
    strapiProgress,
  ] = await Promise.all([
    queries.dashboard.buildPipeline(locale),
    queries.maintenance.getCounts(),
    calendar.listForRange({
      from: week.from,
      to: week.to,
      locale,
      types: [...CALENDAR_CONTENT_TYPES],
      includePublished: true,
      backlogLimit: 0,
    }),
    queries.dashboard.listMergedBacklog(locale, 10),
    queries.dashboard.listRecentlyUpdated(locale, 8),
    queries.dashboard.fetchHealth(locale),
    queries.dashboard.fetchLastPublished(locale),
    getStrapiImportStatus(event),
  ])

  const thisWeek = calendarResult.data
    .filter((item: CalendarItem) => item.calendarAt)
    .sort((a, b) => (a.calendarAt ?? '').localeCompare(b.calendarAt ?? ''))

  const lastMessage = strapiProgress.messages.length > 0
    ? strapiProgress.messages[strapiProgress.messages.length - 1]
    : undefined

  return {
    locale,
    week,
    pipeline,
    taxonomy: {
      categoryArticles: counts.categoryArticles,
      recipeCategories: counts.categories,
      media: counts.media,
    },
    thisWeek,
    backlog,
    recentlyUpdated,
    lastPublished,
    health,
    strapiImport: {
      status: strapiProgress.status,
      dryRun: strapiProgress.dryRun,
      step: strapiProgress.currentStep,
      message: lastMessage,
    },
  }
}
