import { eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'
import { categoryArticles } from '../schema/categories'

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
  }
}
