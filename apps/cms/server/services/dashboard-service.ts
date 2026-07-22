import { and, count, desc, eq, isNull, like, not, or, sql } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import type { CalendarContentType, CalendarItem } from '../../shared/calendar'
import { CALENDAR_CONTENT_TYPES, isoWeekRange } from '../../shared/calendar'
import {
  DASHBOARD_CONTENT_LABELS,
  type DashboardBacklogItem,
  type DashboardHealthCounts,
  type DashboardLastPublished,
  type DashboardPipelineRow,
  type DashboardRecentItem,
  type DashboardSummary,
} from '../../shared/dashboard'
import { createCalendarService } from './calendar-service'
import { getMaintenanceCounts } from './maintenance-purge'
import { getStrapiImportStatus } from './strapi-import-status'
import { MEDIA_FOLDER_MARKER } from '../../shared/media-paths'

const LIST_PATH: Record<CalendarContentType, string> = {
  articles: '/articles',
  recipes: '/recipes',
  pages: '/pages',
}

function editPath(contentType: CalendarContentType, id: number): string {
  const base = contentType === 'articles'
    ? 'articles'
    : contentType === 'recipes'
      ? 'recipes'
      : 'pages'
  return `/${base}/${id}`
}

async function countByStatus(
  db: AppDb,
  table: typeof schema.articles | typeof schema.recipes | typeof schema.pages,
  locale: string,
) {
  const rows = await db
    .select({
      status: table.status,
      value: count(),
    })
    .from(table)
    .where(and(
      isNull(table.deletedAt),
      eq(table.locale, locale),
    ))
    .groupBy(table.status)
    .all()

  const totals = { draft: 0, scheduled: 0, published: 0 }
  for (const row of rows) {
    if (row.status === 'draft' || row.status === 'scheduled' || row.status === 'published') {
      totals[row.status] = Number(row.value)
    }
  }
  return totals
}

async function buildPipeline(db: AppDb, locale: string): Promise<DashboardPipelineRow[]> {
  const [articles, recipes, pages] = await Promise.all([
    countByStatus(db, schema.articles, locale),
    countByStatus(db, schema.recipes, locale),
    countByStatus(db, schema.pages, locale),
  ])

  const data: Array<{ contentType: CalendarContentType, totals: typeof articles }> = [
    { contentType: 'articles', totals: articles },
    { contentType: 'recipes', totals: recipes },
    { contentType: 'pages', totals: pages },
  ]

  return data.map(({ contentType, totals }) => ({
    contentType,
    label: DASHBOARD_CONTENT_LABELS[contentType],
    listPath: LIST_PATH[contentType],
    draft: totals.draft,
    scheduled: totals.scheduled,
    published: totals.published,
  }))
}

async function listMergedBacklog(db: AppDb, locale: string, limit: number): Promise<DashboardBacklogItem[]> {
  const perType = Math.ceil(limit / 3)

  const [articleRows, recipeRows, pageRows] = await Promise.all([
    db.select({
      id: schema.articles.id,
      title: schema.articles.title,
      status: schema.articles.status,
      scheduledAt: schema.articles.scheduledAt,
      publishedAt: schema.articles.publishedAt,
      updatedAt: schema.articles.updatedAt,
    })
      .from(schema.articles)
      .where(and(
        isNull(schema.articles.deletedAt),
        eq(schema.articles.locale, locale),
        eq(schema.articles.status, 'draft'),
      ))
      .orderBy(desc(schema.articles.updatedAt))
      .limit(perType)
      .all(),
    db.select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      status: schema.recipes.status,
      scheduledAt: schema.recipes.scheduledAt,
      publishedAt: schema.recipes.publishedAt,
      updatedAt: schema.recipes.updatedAt,
    })
      .from(schema.recipes)
      .where(and(
        isNull(schema.recipes.deletedAt),
        eq(schema.recipes.locale, locale),
        eq(schema.recipes.status, 'draft'),
      ))
      .orderBy(desc(schema.recipes.updatedAt))
      .limit(perType)
      .all(),
    db.select({
      id: schema.pages.id,
      title: schema.pages.title,
      name: schema.pages.name,
      status: schema.pages.status,
      scheduledAt: schema.pages.scheduledAt,
      publishedAt: schema.pages.publishedAt,
      updatedAt: schema.pages.updatedAt,
    })
      .from(schema.pages)
      .where(and(
        isNull(schema.pages.deletedAt),
        eq(schema.pages.locale, locale),
        eq(schema.pages.status, 'draft'),
      ))
      .orderBy(desc(schema.pages.updatedAt))
      .limit(perType)
      .all(),
  ])

  const items: DashboardBacklogItem[] = [
    ...articleRows.map(row => ({
      id: row.id,
      contentType: 'articles' as const,
      title: row.title,
      status: row.status,
      calendarAt: null,
      draggable: true,
      editPath: editPath('articles', row.id),
      updatedAt: row.updatedAt,
    })),
    ...recipeRows.map(row => ({
      id: row.id,
      contentType: 'recipes' as const,
      title: row.title,
      status: row.status,
      calendarAt: null,
      draggable: true,
      editPath: editPath('recipes', row.id),
      updatedAt: row.updatedAt,
    })),
    ...pageRows.map(row => ({
      id: row.id,
      contentType: 'pages' as const,
      title: row.title?.trim() || row.name,
      status: row.status,
      calendarAt: null,
      draggable: true,
      editPath: editPath('pages', row.id),
      updatedAt: row.updatedAt,
    })),
  ]

  return items
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
}

async function listRecentlyUpdated(db: AppDb, locale: string, limit: number): Promise<DashboardRecentItem[]> {
  const perType = Math.ceil(limit / 2)

  const [articleRows, recipeRows, pageRows] = await Promise.all([
    db.select({
      id: schema.articles.id,
      title: schema.articles.title,
      status: schema.articles.status,
      updatedAt: schema.articles.updatedAt,
    })
      .from(schema.articles)
      .where(and(isNull(schema.articles.deletedAt), eq(schema.articles.locale, locale)))
      .orderBy(desc(schema.articles.updatedAt))
      .limit(perType)
      .all(),
    db.select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      status: schema.recipes.status,
      updatedAt: schema.recipes.updatedAt,
    })
      .from(schema.recipes)
      .where(and(isNull(schema.recipes.deletedAt), eq(schema.recipes.locale, locale)))
      .orderBy(desc(schema.recipes.updatedAt))
      .limit(perType)
      .all(),
    db.select({
      id: schema.pages.id,
      title: schema.pages.title,
      name: schema.pages.name,
      status: schema.pages.status,
      updatedAt: schema.pages.updatedAt,
    })
      .from(schema.pages)
      .where(and(isNull(schema.pages.deletedAt), eq(schema.pages.locale, locale)))
      .orderBy(desc(schema.pages.updatedAt))
      .limit(perType)
      .all(),
  ])

  const items: DashboardRecentItem[] = [
    ...articleRows.map(row => ({
      id: row.id,
      contentType: 'articles' as const,
      title: row.title,
      status: row.status,
      updatedAt: row.updatedAt,
      editPath: editPath('articles', row.id),
    })),
    ...recipeRows.map(row => ({
      id: row.id,
      contentType: 'recipes' as const,
      title: row.title,
      status: row.status,
      updatedAt: row.updatedAt,
      editPath: editPath('recipes', row.id),
    })),
    ...pageRows.map(row => ({
      id: row.id,
      contentType: 'pages' as const,
      title: row.title?.trim() || row.name,
      status: row.status,
      updatedAt: row.updatedAt,
      editPath: editPath('pages', row.id),
    })),
  ]

  return items
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
}

async function countPublishedMissingCover(db: AppDb, locale: string): Promise<number> {
  const [articles, recipes] = await Promise.all([
    db.select({ value: count() })
      .from(schema.articles)
      .where(and(
        isNull(schema.articles.deletedAt),
        eq(schema.articles.locale, locale),
        eq(schema.articles.status, 'published'),
        isNull(schema.articles.coverBlobPathname),
      ))
      .get(),
    db.select({ value: count() })
      .from(schema.recipes)
      .where(and(
        isNull(schema.recipes.deletedAt),
        eq(schema.recipes.locale, locale),
        eq(schema.recipes.status, 'published'),
        isNull(schema.recipes.coverBlobPathname),
      ))
      .get(),
  ])
  return Number(articles?.value ?? 0) + Number(recipes?.value ?? 0)
}

async function countPublishedMissingSeo(db: AppDb, locale: string): Promise<number> {
  const emptyDescription = or(
    isNull(schema.seo.id),
    sql`trim(coalesce(${schema.seo.description}, '')) = ''`,
  )

  const [articles, recipes, pages] = await Promise.all([
    db.select({ value: count() })
      .from(schema.articles)
      .leftJoin(schema.seo, eq(schema.seo.articleId, schema.articles.id))
      .where(and(
        isNull(schema.articles.deletedAt),
        eq(schema.articles.locale, locale),
        eq(schema.articles.status, 'published'),
        emptyDescription,
      ))
      .get(),
    db.select({ value: count() })
      .from(schema.recipes)
      .leftJoin(schema.seo, eq(schema.seo.recipeId, schema.recipes.id))
      .where(and(
        isNull(schema.recipes.deletedAt),
        eq(schema.recipes.locale, locale),
        eq(schema.recipes.status, 'published'),
        emptyDescription,
      ))
      .get(),
    db.select({ value: count() })
      .from(schema.pages)
      .leftJoin(schema.seo, eq(schema.seo.pageId, schema.pages.id))
      .where(and(
        isNull(schema.pages.deletedAt),
        eq(schema.pages.locale, locale),
        eq(schema.pages.status, 'published'),
        emptyDescription,
      ))
      .get(),
  ])

  return Number(articles?.value ?? 0) + Number(recipes?.value ?? 0) + Number(pages?.value ?? 0)
}

async function countImagesMissingAlt(db: AppDb): Promise<number> {
  const row = await db
    .select({ value: count() })
    .from(schema.blobs)
    .where(and(
      like(schema.blobs.mimeType, 'image/%'),
      not(like(schema.blobs.pathname, `%/${MEDIA_FOLDER_MARKER}`)),
      or(isNull(schema.blobs.altText), sql`trim(${schema.blobs.altText}) = ''`),
    ))
    .get()
  return Number(row?.value ?? 0)
}

async function fetchHealth(db: AppDb, locale: string): Promise<DashboardHealthCounts> {
  const [publishedMissingCover, publishedMissingSeoDescription, imagesMissingAlt] = await Promise.all([
    countPublishedMissingCover(db, locale),
    countPublishedMissingSeo(db, locale),
    countImagesMissingAlt(db),
  ])
  return { publishedMissingCover, publishedMissingSeoDescription, imagesMissingAlt }
}

async function fetchLastPublished(
  db: AppDb,
  locale: string,
): Promise<Partial<Record<CalendarContentType, DashboardLastPublished | null>>> {
  const [article, recipe] = await Promise.all([
    db.select({
      id: schema.articles.id,
      title: schema.articles.title,
      publishedAt: schema.articles.publishedAt,
    })
      .from(schema.articles)
      .where(and(
        isNull(schema.articles.deletedAt),
        eq(schema.articles.locale, locale),
        eq(schema.articles.status, 'published'),
        not(isNull(schema.articles.publishedAt)),
      ))
      .orderBy(desc(schema.articles.publishedAt))
      .limit(1)
      .get(),
    db.select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      publishedAt: schema.recipes.publishedAt,
    })
      .from(schema.recipes)
      .where(and(
        isNull(schema.recipes.deletedAt),
        eq(schema.recipes.locale, locale),
        eq(schema.recipes.status, 'published'),
        not(isNull(schema.recipes.publishedAt)),
      ))
      .orderBy(desc(schema.recipes.publishedAt))
      .limit(1)
      .get(),
  ])

  return {
    articles: article?.publishedAt
      ? {
          title: article.title,
          publishedAt: article.publishedAt,
          editPath: editPath('articles', article.id),
        }
      : null,
    recipes: recipe?.publishedAt
      ? {
          title: recipe.title,
          publishedAt: recipe.publishedAt,
          editPath: editPath('recipes', recipe.id),
        }
      : null,
  }
}

export async function buildDashboardSummary(
  db: AppDb,
  event: Parameters<typeof getStrapiImportStatus>[0],
  locale: string,
): Promise<DashboardSummary> {
  const week = isoWeekRange()
  const calendar = createCalendarService(db)

  const [
    pipeline,
    maintenance,
    calendarResult,
    backlog,
    recentlyUpdated,
    health,
    lastPublished,
    strapiProgress,
  ] = await Promise.all([
    buildPipeline(db, locale),
    getMaintenanceCounts(db),
    calendar.listForRange({
      from: week.from,
      to: week.to,
      locale,
      types: [...CALENDAR_CONTENT_TYPES],
      includePublished: true,
      backlogLimit: 0,
    }),
    listMergedBacklog(db, locale, 10),
    listRecentlyUpdated(db, locale, 8),
    fetchHealth(db, locale),
    fetchLastPublished(db, locale),
    getStrapiImportStatus(event),
  ])

  const thisWeek = calendarResult.data
    .filter(item => item.calendarAt)
    .sort((a, b) => (a.calendarAt ?? '').localeCompare(b.calendarAt ?? ''))

  const lastMessage = strapiProgress.messages.length > 0
    ? strapiProgress.messages[strapiProgress.messages.length - 1]
    : undefined

  return {
    locale,
    week,
    pipeline,
    taxonomy: {
      categoryArticles: maintenance.categoryArticles,
      recipeCategories: maintenance.categories,
      media: maintenance.media,
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
