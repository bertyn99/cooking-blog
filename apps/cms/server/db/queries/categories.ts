import { eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { categories } from '../schema/categories'

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
  }
}
