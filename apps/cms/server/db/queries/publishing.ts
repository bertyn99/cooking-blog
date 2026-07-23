import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { queryConflict, queryNotFound, isQueryError } from '../../db/query-errors'
import type { PublishableContentType } from '../../utils/content-types'
import { createContentRevisionQueries } from './content-revisions'
import { assertHumanReviewAllowsPublish } from '../../utils/human-review-publish'

type SchedulableTable =
  | typeof schema.articles
  | typeof schema.recipes
  | typeof schema.pages
  | typeof schema.categories
  | typeof schema.categoryArticles

type VersionedContentTable =
  | typeof schema.articles
  | typeof schema.recipes
  | typeof schema.pages

const CONTENT_TABLES = {
  articles: { table: schema.articles, trackFirstPublished: true, versioned: true },
  recipes: { table: schema.recipes, trackFirstPublished: true, versioned: true },
  pages: { table: schema.pages, trackFirstPublished: true, versioned: true },
  categories: { table: schema.categories, trackFirstPublished: false, versioned: false },
  'category-articles': { table: schema.categoryArticles, trackFirstPublished: false, versioned: false },
} as const satisfies Record<PublishableContentType, {
  table: SchedulableTable
  trackFirstPublished: boolean
  versioned: boolean
}>

export interface PublishActorContext {
  actorUserId?: number | null
}

type PublishDb = Pick<AppDb, 'select' | 'update' | 'insert' | 'transaction'>

function getContentConfig(contentType: PublishableContentType) {
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

function rowToSnapshot(row: Record<string, unknown>) {
  return { ...row }
}

async function publishVersionedRow(
  db: PublishDb,
  contentType: PublishableContentType,
  table: VersionedContentTable,
  id: number,
  now: string,
  actor?: PublishActorContext,
) {
  const revisions = createContentRevisionQueries(db as AppDb)
  const row = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .get()

  if (!row) {
    return false
  }

  const currentVersion = row.version ?? 1
  const nextVersion = currentVersion + 1
  const firstPublishedAt = 'firstPublishedAt' in row ? row.firstPublishedAt : null

  if (contentType === 'articles' || contentType === 'recipes') {
    await assertHumanReviewAllowsPublish(
      db as AppDb,
      contentType === 'articles' ? 'article' : 'recipe',
      id,
      currentVersion,
      Boolean('requiresHumanReview' in row && row.requiresHumanReview),
    )
  }

  await db.update(table).set({
    status: 'published',
    publishedAt: now,
    scheduledAt: null,
    updatedAt: now,
    version: nextVersion,
    ...(!firstPublishedAt ? { firstPublishedAt: now } : {}),
  }).where(eq(table.id, id))

  const published = await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .get()

  if (published) {
    await revisions.recordPublishSnapshot({
      contentType,
      contentId: id,
      version: nextVersion,
      snapshot: rowToSnapshot(published as Record<string, unknown>),
      actorUserId: actor?.actorUserId,
    })
  }

  return true
}

async function publishSimpleRow(
  db: PublishDb,
  table: Exclude<SchedulableTable, VersionedContentTable>,
  id: number,
  now: string,
) {
  await db.update(table).set({
    status: 'published',
    publishedAt: now,
    scheduledAt: null,
    updatedAt: now,
  }).where(eq(table.id, id))
}

async function publishDueVersioned(
  db: AppDb,
  contentType: PublishableContentType,
  table: VersionedContentTable,
  now: string,
): Promise<{ published: number, skipped: number }> {
  const due = await db
    .select({ id: table.id })
    .from(table)
    .where(scheduledDueWhere(table, now))
    .all()

  let published = 0
  let skipped = 0

  for (const row of due) {
    try {
      await db.transaction(async (tx) => {
        const ok = await publishVersionedRow(
          tx as PublishDb,
          contentType,
          table,
          row.id,
          now,
        )
        if (!ok) {
          throw queryNotFound(`${contentType} not found`)
        }
      })
      published++
    }
    catch (error) {
      if (isQueryError(error) && error.code === 'CONFLICT') {
        skipped++
        continue
      }
      throw error
    }
  }

  return { published, skipped }
}

async function publishDueSimple(
  db: AppDb,
  table: Exclude<SchedulableTable, VersionedContentTable>,
  now: string,
): Promise<number> {
  const due = await db
    .select({ id: table.id })
    .from(table)
    .where(scheduledDueWhere(table, now))
    .all()

  for (const row of due) {
    await publishSimpleRow(db as PublishDb, table, row.id, now)
  }

  return due.length
}

export function createPublishingQueries(db: AppDb) {
  return {
    async publishDueScheduled(): Promise<{ published: number, skipped: number }> {
      const now = new Date().toISOString()

      let published = 0
      let skipped = 0

      const articlesResult = await publishDueVersioned(db, 'articles', schema.articles, now)
      published += articlesResult.published
      skipped += articlesResult.skipped

      const recipesResult = await publishDueVersioned(db, 'recipes', schema.recipes, now)
      published += recipesResult.published
      skipped += recipesResult.skipped

      const pagesResult = await publishDueVersioned(db, 'pages', schema.pages, now)
      published += pagesResult.published
      skipped += pagesResult.skipped

      published += await publishDueSimple(db, schema.categories, now)
      published += await publishDueSimple(db, schema.categoryArticles, now)

      return { published, skipped }
    },

    async publish(contentType: PublishableContentType, id: number, actor?: PublishActorContext) {
      const config = getContentConfig(contentType)
      const now = new Date().toISOString()

      if (config.versioned) {
        const ok = await publishVersionedRow(
          db,
          contentType,
          config.table as VersionedContentTable,
          id,
          now,
          actor,
        )
        if (!ok) {
          throw queryNotFound(`${contentType} not found`)
        }
      }
      else {
        const existing = await db
          .select({ id: config.table.id })
          .from(config.table)
          .where(eq(config.table.id, id))
          .get()

        if (!existing) {
          throw queryNotFound(`${contentType} not found`)
        }

        await publishSimpleRow(db, config.table as Exclude<SchedulableTable, VersionedContentTable>, id, now)
      }

      return { status: 'published' as const, publishedAt: now }
    },

    async schedule(contentType: PublishableContentType, id: number, scheduledAt: string) {
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
        throw queryNotFound(`${contentType} not found`)
      }

      if (existing.status === 'published') {
        throw queryConflict(
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

    async unpublish(contentType: PublishableContentType, id: number) {
      const config = getContentConfig(contentType)
      const existing = await db
        .select({ id: config.table.id })
        .from(config.table)
        .where(eq(config.table.id, id))
        .get()

      if (!existing) {
        throw queryNotFound(`${contentType} not found`)
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
