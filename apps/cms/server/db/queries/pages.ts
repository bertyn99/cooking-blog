import { sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { pages } from '../schema/pages'
import { paginateResult } from '../../utils/pagination'
import {
  buildPagesQueryWhere,
  buildPagesWith,
  buildPageDetailQueryWhere,
  type PagesQueryOptions,
} from '../../utils/queries/pages'
import { mergeConditions, applyPublishedScope, localeFilter } from './_shared/filters'

export interface PageListOptions extends PagesQueryOptions {
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

export function createPageQueries(db: AppDb) {
  return {
    async listPage(opts: PageListOptions) {
      const where = mergeConditions(
        ...applyPublishedScope(pages, {
          scope: opts.isAuthenticated ? 'admin' : 'public',
        }),
        localeFilter(pages, opts.locale),
      )

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(pages)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const rows = await db.query.pages.findMany({
        where: buildPagesQueryWhere(opts),
        with: buildPagesWith(opts.include),
        orderBy: { createdAt: 'desc' },
        limit: opts.pagination.limit,
        offset: opts.pagination.offset,
      })

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number, include: string[] = [], scope: 'public' | 'admin' = 'public') {
      return db.query.pages.findFirst({
        where: buildPageDetailQueryWhere(id, scope === 'admin'),
        with: buildPagesWith(include),
      })
    },
  }
}
