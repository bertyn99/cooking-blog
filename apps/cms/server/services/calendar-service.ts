import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import type { CalendarContentType, CalendarItem } from '../../shared/calendar'
import {
  calendarRangeBounds,
  isCalendarItemDraggable,
  resolveCalendarAt,
} from '../../shared/calendar'

export interface CalendarQueryOptions {
  from: string
  to: string
  locale: string
  types: CalendarContentType[]
  includePublished: boolean
  backlogLimit: number
}

function editPath(contentType: CalendarContentType, id: number): string {
  const base = contentType === 'articles'
    ? 'articles'
    : contentType === 'recipes'
      ? 'recipes'
      : 'pages'
  return `/${base}/${id}`
}

function toItem(
  contentType: CalendarContentType,
  row: {
    id: number
    title: string
    status: 'draft' | 'published' | 'scheduled'
    scheduledAt: string | null
    publishedAt: string | null
  },
): CalendarItem {
  return {
    id: row.id,
    contentType,
    title: row.title,
    status: row.status,
    calendarAt: resolveCalendarAt(row.status, row.scheduledAt, row.publishedAt),
    draggable: isCalendarItemDraggable(row.status),
    editPath: editPath(contentType, row.id),
  }
}

export function createCalendarService(db: AppDb) {
  return {
    async listForRange(opts: CalendarQueryOptions): Promise<{ data: CalendarItem[], backlog: CalendarItem[] }> {
      const { fromIso, toIso } = calendarRangeBounds(opts.from, opts.to)
      const data: CalendarItem[] = []
      const backlog: CalendarItem[] = []

      if (opts.types.includes('articles')) {
        data.push(...await listArticlesInRange(db, opts.locale, fromIso, toIso, opts.includePublished))
        backlog.push(...await listArticleBacklog(db, opts.locale, opts.backlogLimit))
      }

      if (opts.types.includes('recipes')) {
        data.push(...await listRecipesInRange(db, opts.locale, fromIso, toIso, opts.includePublished))
        backlog.push(...await listRecipeBacklog(db, opts.locale, opts.backlogLimit))
      }

      if (opts.types.includes('pages')) {
        data.push(...await listPagesInRange(db, opts.locale, fromIso, toIso, opts.includePublished))
        backlog.push(...await listPageBacklog(db, opts.locale, opts.backlogLimit))
      }

      data.sort((a, b) => (a.calendarAt ?? '').localeCompare(b.calendarAt ?? ''))

      return { data, backlog }
    },
  }
}

async function listArticlesInRange(
  db: AppDb,
  locale: string,
  fromIso: string,
  toIso: string,
  includePublished: boolean,
) {
  const scheduled = await db
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      status: schema.articles.status,
      scheduledAt: schema.articles.scheduledAt,
      publishedAt: schema.articles.publishedAt,
    })
    .from(schema.articles)
    .where(and(
      isNull(schema.articles.deletedAt),
      eq(schema.articles.locale, locale),
      eq(schema.articles.status, 'scheduled'),
      gte(schema.articles.scheduledAt, fromIso),
      lte(schema.articles.scheduledAt, toIso),
    ))
    .all()

  const published = includePublished
    ? await db
        .select({
          id: schema.articles.id,
          title: schema.articles.title,
          status: schema.articles.status,
          scheduledAt: schema.articles.scheduledAt,
          publishedAt: schema.articles.publishedAt,
        })
        .from(schema.articles)
        .where(and(
          isNull(schema.articles.deletedAt),
          eq(schema.articles.locale, locale),
          eq(schema.articles.status, 'published'),
          gte(schema.articles.publishedAt, fromIso),
          lte(schema.articles.publishedAt, toIso),
        ))
        .all()
    : []

  return [...scheduled, ...published].map(row => toItem('articles', row))
}

async function listRecipesInRange(
  db: AppDb,
  locale: string,
  fromIso: string,
  toIso: string,
  includePublished: boolean,
) {
  const scheduled = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      status: schema.recipes.status,
      scheduledAt: schema.recipes.scheduledAt,
      publishedAt: schema.recipes.publishedAt,
    })
    .from(schema.recipes)
    .where(and(
      isNull(schema.recipes.deletedAt),
      eq(schema.recipes.locale, locale),
      eq(schema.recipes.status, 'scheduled'),
      gte(schema.recipes.scheduledAt, fromIso),
      lte(schema.recipes.scheduledAt, toIso),
    ))
    .all()

  const published = includePublished
    ? await db
        .select({
          id: schema.recipes.id,
          title: schema.recipes.title,
          status: schema.recipes.status,
          scheduledAt: schema.recipes.scheduledAt,
          publishedAt: schema.recipes.publishedAt,
        })
        .from(schema.recipes)
        .where(and(
          isNull(schema.recipes.deletedAt),
          eq(schema.recipes.locale, locale),
          eq(schema.recipes.status, 'published'),
          gte(schema.recipes.publishedAt, fromIso),
          lte(schema.recipes.publishedAt, toIso),
        ))
        .all()
    : []

  return [...scheduled, ...published].map(row => toItem('recipes', row))
}

async function listPagesInRange(
  db: AppDb,
  locale: string,
  fromIso: string,
  toIso: string,
  includePublished: boolean,
) {
  const scheduled = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      name: schema.pages.name,
      status: schema.pages.status,
      scheduledAt: schema.pages.scheduledAt,
      publishedAt: schema.pages.publishedAt,
    })
    .from(schema.pages)
    .where(and(
      isNull(schema.pages.deletedAt),
      eq(schema.pages.locale, locale),
      eq(schema.pages.status, 'scheduled'),
      gte(schema.pages.scheduledAt, fromIso),
      lte(schema.pages.scheduledAt, toIso),
    ))
    .all()

  const published = includePublished
    ? await db
        .select({
          id: schema.pages.id,
          title: schema.pages.title,
          name: schema.pages.name,
          status: schema.pages.status,
          scheduledAt: schema.pages.scheduledAt,
          publishedAt: schema.pages.publishedAt,
        })
        .from(schema.pages)
        .where(and(
          isNull(schema.pages.deletedAt),
          eq(schema.pages.locale, locale),
          eq(schema.pages.status, 'published'),
          gte(schema.pages.publishedAt, fromIso),
          lte(schema.pages.publishedAt, toIso),
        ))
        .all()
    : []

  return [...scheduled, ...published].map(row => toItem('pages', {
    id: row.id,
    title: row.title?.trim() || row.name,
    status: row.status,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
  }))
}

async function listArticleBacklog(db: AppDb, locale: string, limit: number) {
  const rows = await db
    .select({
      id: schema.articles.id,
      title: schema.articles.title,
      status: schema.articles.status,
      scheduledAt: schema.articles.scheduledAt,
      publishedAt: schema.articles.publishedAt,
    })
    .from(schema.articles)
    .where(and(
      isNull(schema.articles.deletedAt),
      eq(schema.articles.locale, locale),
      eq(schema.articles.status, 'draft'),
    ))
    .orderBy(desc(schema.articles.updatedAt))
    .limit(limit)
    .all()

  return rows.map(row => toItem('articles', row))
}

async function listRecipeBacklog(db: AppDb, locale: string, limit: number) {
  const rows = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      status: schema.recipes.status,
      scheduledAt: schema.recipes.scheduledAt,
      publishedAt: schema.recipes.publishedAt,
    })
    .from(schema.recipes)
    .where(and(
      isNull(schema.recipes.deletedAt),
      eq(schema.recipes.locale, locale),
      eq(schema.recipes.status, 'draft'),
    ))
    .orderBy(desc(schema.recipes.updatedAt))
    .limit(limit)
    .all()

  return rows.map(row => toItem('recipes', row))
}

async function listPageBacklog(db: AppDb, locale: string, limit: number) {
  const rows = await db
    .select({
      id: schema.pages.id,
      title: schema.pages.title,
      name: schema.pages.name,
      status: schema.pages.status,
      scheduledAt: schema.pages.scheduledAt,
      publishedAt: schema.pages.publishedAt,
    })
    .from(schema.pages)
    .where(and(
      isNull(schema.pages.deletedAt),
      eq(schema.pages.locale, locale),
      eq(schema.pages.status, 'draft'),
    ))
    .orderBy(desc(schema.pages.updatedAt))
    .limit(limit)
    .all()

  return rows.map(row => toItem('pages', {
    id: row.id,
    title: row.title?.trim() || row.name,
    status: row.status,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
  }))
}
