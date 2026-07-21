import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import { createApiError } from '../utils/errors'
import type { PublishableContentType } from '../utils/content-types'
import { isPublishableContentType } from '../utils/content-types'

type SchedulableTable =
  | typeof schema.articles
  | typeof schema.recipes
  | typeof schema.pages
  | typeof schema.categories
  | typeof schema.categoryArticles

type TrackFirstPublishedTable = typeof schema.articles | typeof schema.recipes

const CONTENT_TABLES = {
  articles: { table: schema.articles, trackFirstPublished: true },
  recipes: { table: schema.recipes, trackFirstPublished: true },
  pages: { table: schema.pages, trackFirstPublished: false },
  categories: { table: schema.categories, trackFirstPublished: false },
  'category-articles': { table: schema.categoryArticles, trackFirstPublished: false },
} as const satisfies Record<PublishableContentType, {
  table: SchedulableTable
  trackFirstPublished: boolean
}>

type PublishDb = Pick<AppDb, 'select' | 'update'>

export function createPublishingService(db: AppDb) {
  return {
    async publishDueScheduled(): Promise<{ published: number }> {
      const now = new Date().toISOString()

      return db.transaction(async (tx) => {
        const publishDb = tx as PublishDb
        let published = 0
        published += await publishDueArticles(publishDb, schema.articles, now)
        published += await publishDueArticles(publishDb, schema.recipes, now)
        published += await publishDueSimple(publishDb, schema.pages, now)
        published += await publishDueSimple(publishDb, schema.categories, now)
        published += await publishDueSimple(publishDb, schema.categoryArticles, now)
        return { published }
      })
    },

    async publish(contentType: string, id: number) {
      const config = getContentConfig(contentType)
      const now = new Date().toISOString()
      const existing = await db
        .select({ id: config.table.id })
        .from(config.table)
        .where(eq(config.table.id, id))
        .get()

      if (!existing) {
        throw createApiError('NOT_FOUND', `${contentType} not found`)
      }

      if (config.trackFirstPublished) {
        const row = await db
          .select({ firstPublishedAt: (config.table as TrackFirstPublishedTable).firstPublishedAt })
          .from(config.table)
          .where(eq(config.table.id, id))
          .get()

        await db.update(config.table as TrackFirstPublishedTable).set({
          status: 'published',
          publishedAt: now,
          scheduledAt: null,
          updatedAt: now,
          ...(!row?.firstPublishedAt ? { firstPublishedAt: now } : {}),
        }).where(eq(config.table.id, id))
      }
      else {
        await db.update(config.table).set({
          status: 'published',
          publishedAt: now,
          scheduledAt: null,
          updatedAt: now,
        }).where(eq(config.table.id, id))
      }

      return { status: 'published' as const, publishedAt: now }
    },

    async schedule(contentType: string, id: number, scheduledAt: string) {
      const config = getContentConfig(contentType)
      const existing = await db
        .select({
          id: config.table.id,
          status: config.table.status,
          deletedAt: config.table.deletedAt,
        })
        .from(config.table)
        .where(eq(config.table.id, id))
        .get()

      if (!existing || existing.deletedAt) {
        throw createApiError('NOT_FOUND', `${contentType} not found`)
      }

      if (existing.status === 'published') {
        throw createApiError(
          'CONFLICT',
          'Published content cannot be rescheduled from the calendar',
        )
      }

      const now = new Date().toISOString()
      await db.update(config.table).set({
        status: 'scheduled',
        scheduledAt,
        updatedAt: now,
      }).where(eq(config.table.id, id))

      return { status: 'scheduled' as const, scheduledAt }
    },

    async unpublish(contentType: string, id: number) {
      const config = getContentConfig(contentType)
      const existing = await db
        .select({ id: config.table.id })
        .from(config.table)
        .where(eq(config.table.id, id))
        .get()

      if (!existing) {
        throw createApiError('NOT_FOUND', `${contentType} not found`)
      }

      const now = new Date().toISOString()
      await db.update(config.table).set({
        status: 'draft',
        publishedAt: null,
        scheduledAt: null,
        updatedAt: now,
      }).where(eq(config.table.id, id))

      return { status: 'draft' as const }
    },
  }
}

function getContentConfig(contentType: string) {
  if (!isPublishableContentType(contentType)) {
    throw createApiError('VALIDATION_ERROR', `Unknown content type: ${contentType}`)
  }
  return CONTENT_TABLES[contentType]
}

function scheduledDueWhere<T extends SchedulableTable>(table: T, now: string) {
  return and(
    eq(table.status, 'scheduled'),
    isNotNull(table.scheduledAt),
    lte(table.scheduledAt, now),
    isNull(table.deletedAt),
  )
}

async function publishDueArticles(
  db: PublishDb,
  table: TrackFirstPublishedTable,
  now: string,
): Promise<number> {
  const due = await db
    .select({ id: table.id, firstPublishedAt: table.firstPublishedAt })
    .from(table)
    .where(scheduledDueWhere(table, now))
    .all()

  for (const row of due) {
    await db.update(table).set({
      status: 'published',
      publishedAt: now,
      scheduledAt: null,
      updatedAt: now,
      ...(!row.firstPublishedAt ? { firstPublishedAt: now } : {}),
    }).where(eq(table.id, row.id))
  }

  return due.length
}

async function publishDueSimple(
  db: PublishDb,
  table: Exclude<SchedulableTable, TrackFirstPublishedTable>,
  now: string,
): Promise<number> {
  const due = await db
    .select({ id: table.id })
    .from(table)
    .where(scheduledDueWhere(table, now))
    .all()

  for (const row of due) {
    await db.update(table).set({
      status: 'published',
      publishedAt: now,
      scheduledAt: null,
      updatedAt: now,
    }).where(eq(table.id, row.id))
  }

  return due.length
}
