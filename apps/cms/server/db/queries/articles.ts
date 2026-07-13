import { eq, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { parsePagination, paginateResult } from '../../utils/pagination'
import { buildArticlesQueryWhere, buildArticlesWith, type ArticlesQueryOptions } from '../../utils/queries/articles'
import { mergeConditions, applyPublishedScope, localeFilter, searchFilter, statusFilter } from './_shared/filters'
import { articles } from '../schema/articles'

export interface ArticleListOptions extends ArticlesQueryOptions {
  pagination: ReturnType<typeof parsePagination>
}

export function createArticleQueries(db: AppDb) {
  return {
    async listPage(opts: ArticleListOptions) {
      const where = mergeConditions(
        ...applyPublishedScope(articles, {
          scope: opts.isAuthenticated ? 'admin' : 'public',
          includeDeleted: opts.includeDeleted,
        }),
        opts.filters?.slug ? eq(articles.slug, opts.filters.slug) : undefined,
        opts.filters?.categoryId ? eq(articles.categoryId, opts.filters.categoryId) : undefined,
        localeFilter(articles, opts.filters?.locale),
        statusFilter(articles, opts.filters?.status),
        searchFilter(articles, opts.filters?.search),
      )

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.articles)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const rows = await db.query.articles.findMany({
        where: buildArticlesQueryWhere(opts),
        with: buildArticlesWith(opts.include),
        orderBy: opts.isAuthenticated ? { updatedAt: 'desc' } : { publishedAt: 'desc' },
        limit: opts.pagination.limit,
        offset: opts.pagination.offset,
      })

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number, include: string[] = [], scope: 'public' | 'admin' = 'admin') {
      const scopeFilter = buildArticlesQueryWhere({
        include,
        isAuthenticated: scope === 'admin',
      })

      return db.query.articles.findFirst({
        where: scopeFilter ? { AND: [{ id }, scopeFilter] } : { id },
        with: buildArticlesWith(include),
      })
    },

    findBySlug(slug: string, locale: string, include: string[] = [], scope: 'public' | 'admin' = 'public') {
      return db.query.articles.findFirst({
        where: buildArticlesQueryWhere({
          include,
          isAuthenticated: scope === 'admin',
          filters: { slug, locale },
        }),
        with: buildArticlesWith(include),
      })
    },
  }
}
