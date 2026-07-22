import { and, eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { categoryArticles } from '../schema/categories'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'

export interface CategoryArticleListOptions {
  locale?: string
  scope: 'public' | 'admin'
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

export function createCategoryArticleQueries(db: AppDb) {
  return {
    async listPage(opts: CategoryArticleListOptions) {
      const where = mergeConditions(
        ...applyPublishedScope(categoryArticles, { scope: opts.scope }),
        localeFilter(categoryArticles, opts.locale),
      )

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.categoryArticles)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const rows = await db
        .select()
        .from(schema.categoryArticles)
        .where(where)
        .orderBy(sql`${schema.categoryArticles.createdAt} DESC`)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    async findById(id: number, scope: 'public' | 'admin' = 'public') {
      const where = mergeConditions(
        eq(categoryArticles.id, id),
        ...applyPublishedScope(categoryArticles, { scope }),
      )

      return db
        .select()
        .from(schema.categoryArticles)
        .where(where)
        .get()
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: schema.categoryArticles.id })
          .from(schema.categoryArticles)
          .where(and(eq(schema.categoryArticles.slug, slug), eq(schema.categoryArticles.locale, loc)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof schema.categoryArticles.$inferInsert) {
      return db.insert(schema.categoryArticles).values(values).returning().then(rows => rows[0])
    },

    existsById(id: number) {
      return db
        .select({ id: schema.categoryArticles.id })
        .from(schema.categoryArticles)
        .where(eq(schema.categoryArticles.id, id))
        .limit(1)
        .then(rows => rows.length > 0)
    },

    findRowById(id: number) {
      return db.select().from(schema.categoryArticles).where(eq(schema.categoryArticles.id, id)).get()
    },

    updateById(id: number, updates: Partial<typeof schema.categoryArticles.$inferInsert>) {
      return db
        .update(schema.categoryArticles)
        .set(updates)
        .where(eq(schema.categoryArticles.id, id))
        .returning()
        .then(rows => rows[0])
    },

    softDelete(id: number) {
      const now = new Date().toISOString()
      return db
        .update(schema.categoryArticles)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.categoryArticles.id, id))
        .then(() => now)
    },
  }
}
