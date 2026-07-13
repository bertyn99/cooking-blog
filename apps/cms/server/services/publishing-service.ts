import { and, eq, isNotNull, lte } from 'drizzle-orm'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import { createApiError } from '../utils/errors'
import type { PublishableContentType } from '../utils/content-types'
import { isPublishableContentType } from '../utils/content-types'

type SchedulableColumns = {
  id: SQLiteTableWithColumns<any>['id']
  status: SQLiteTableWithColumns<any>['status']
  scheduledAt: SQLiteTableWithColumns<any>['scheduledAt']
  publishedAt: SQLiteTableWithColumns<any>['publishedAt']
  updatedAt: SQLiteTableWithColumns<any>['updatedAt']
  firstPublishedAt?: SQLiteTableWithColumns<any>['firstPublishedAt']
}

const CONTENT_TABLES: Record<PublishableContentType, {
  table: SQLiteTableWithColumns<any> & SchedulableColumns
  trackFirstPublished: boolean
}> = {
  articles: { table: schema.articles, trackFirstPublished: true },
  recipes: { table: schema.recipes, trackFirstPublished: true },
  pages: { table: schema.pages, trackFirstPublished: false },
  categories: { table: schema.categories, trackFirstPublished: false },
  'category-articles': { table: schema.categoryArticles, trackFirstPublished: false },
}

export function createPublishingService(db: AppDb) {
  return {
    async publishDueScheduled(): Promise<{ published: number }> {
      const now = new Date().toISOString()
      let published = 0

      for (const config of Object.values(CONTENT_TABLES)) {
        published += await publishDueTable(db, config.table, now, config.trackFirstPublished)
      }

      return { published }
    },

    async publish(contentType: string, id: number) {
      const config = getContentConfig(contentType)
      const now = new Date().toISOString()
      const existing = await db.select().from(config.table).where(eq(config.table.id, id)).get()
      if (!existing) {
        throw createApiError('NOT_FOUND', `${contentType} not found`)
      }

      const updates: Record<string, string | null> = {
        status: 'published',
        publishedAt: now,
        scheduledAt: null,
        updatedAt: now,
      }

      if (config.trackFirstPublished && 'firstPublishedAt' in existing && !existing.firstPublishedAt) {
        updates.firstPublishedAt = now
      }

      await db.update(config.table).set(updates).where(eq(config.table.id, id))
      return { status: 'published' as const, publishedAt: now }
    },

    async schedule(contentType: string, id: number, scheduledAt: string) {
      const config = getContentConfig(contentType)
      const existing = await db.select().from(config.table).where(eq(config.table.id, id)).get()
      if (!existing) {
        throw createApiError('NOT_FOUND', `${contentType} not found`)
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
      const existing = await db.select().from(config.table).where(eq(config.table.id, id)).get()
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

async function publishDueTable(
  db: AppDb,
  table: SQLiteTableWithColumns<any> & SchedulableColumns,
  now: string,
  trackFirstPublished: boolean,
): Promise<number> {
  const due = await db
    .select({ id: table.id, firstPublishedAt: trackFirstPublished ? table.firstPublishedAt : undefined })
    .from(table)
    .where(and(
      eq(table.status, 'scheduled'),
      isNotNull(table.scheduledAt),
      lte(table.scheduledAt, now),
    ))
    .all()

  let count = 0
  for (const row of due) {
    const updates: Record<string, string | null> = {
      status: 'published',
      publishedAt: now,
      scheduledAt: null,
      updatedAt: now,
    }

    if (trackFirstPublished && 'firstPublishedAt' in row && !row.firstPublishedAt) {
      updates.firstPublishedAt = now
    }

    await db.update(table).set(updates).where(eq(table.id, row.id))
    count++
  }

  return count
}
