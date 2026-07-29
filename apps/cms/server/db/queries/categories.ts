import { and, eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { categories } from '../schema/categories'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'

export interface CategoryListOptions {
  locale?: string
  scope: 'public' | 'admin'
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

export function createCategoryQueries(db: AppDb) {
  return {
    async listPage(opts: CategoryListOptions) {
      const where = mergeConditions(
        ...applyPublishedScope(categories, { scope: opts.scope }),
        localeFilter(categories, opts.locale),
      )

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.categories)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const rows = await db
        .select()
        .from(schema.categories)
        .where(where)
        .orderBy(sql`${schema.categories.createdAt} DESC`)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    async findById(id: number, scope: 'public' | 'admin' = 'public') {
      const where = mergeConditions(
        eq(categories.id, id),
        ...applyPublishedScope(categories, { scope }),
      )

      return db
        .select()
        .from(schema.categories)
        .where(where)
        .get()
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: schema.categories.id })
          .from(schema.categories)
          .where(and(eq(schema.categories.slug, slug), eq(schema.categories.locale, loc)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof schema.categories.$inferInsert) {
      return db.insert(schema.categories).values(values).returning().then(rows => rows[0])
    },

    existsById(id: number) {
      return db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.id, id))
        .limit(1)
        .then(rows => rows.length > 0)
    },

    findRowById(id: number) {
      return db.select().from(schema.categories).where(eq(schema.categories.id, id)).get()
    },

    updateById(id: number, updates: Partial<typeof schema.categories.$inferInsert>) {
      return db.update(schema.categories).set(updates).where(eq(schema.categories.id, id)).returning().then(rows => rows[0])
    },

    softDelete(id: number) {
      const now = new Date().toISOString()
      return db
        .update(schema.categories)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.categories.id, id))
        .then(() => now)
    },
  }
}
