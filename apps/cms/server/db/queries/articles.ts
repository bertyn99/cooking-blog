import { eq, and, sql, desc } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { buildArticlesQueryWhere, buildArticlesWith, type ArticlesQueryOptions } from './_shared/builders/articles'
import { mergeConditions, applyPublishedScope, localeFilter, searchFilter, statusFilter } from './_shared/filters'
import { reorderByIds } from './_shared/list-page'
import { reserveUniqueSlugInLocale } from './_shared/reserve-slug'
import { articles } from '../schema/articles'

export type ArticleUpdatePatch = Partial<Omit<typeof schema.articles.$inferInsert, 'id' | 'createdAt'>>

export interface ArticleListOptions extends ArticlesQueryOptions {
  pagination: { offset: number, limit: number, page: number, pageSize: number }
}

export function buildArticlesListSqlWhere(opts: ArticleListOptions) {
  return mergeConditions(
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
}

export function createArticleQueries(db: AppDb) {
  return {
    async listPage(opts: ArticleListOptions) {
      const where = buildArticlesListSqlWhere(opts)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.articles)
        .where(where)
        .all()

      const total = countResult[0]?.count ?? 0
      const orderBy = opts.isAuthenticated ? desc(articles.updatedAt) : desc(articles.publishedAt)

      const idRows = await db
        .select({ id: articles.id })
        .from(schema.articles)
        .where(where)
        .orderBy(orderBy)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      const ids = idRows.map(row => row.id)
      if (ids.length === 0) {
        return paginateResult([], total, opts.pagination.page, opts.pagination.pageSize)
      }

      const rows = reorderByIds(
        await db.query.articles.findMany({
          where: { id: { in: ids } },
          with: buildArticlesWith(opts.include),
        }),
        ids,
      )

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

    findRowById(id: number) {
      return db.select().from(schema.articles).where(eq(articles.id, id)).get()
    },

    listSlugsInLocale(locale: string) {
      return db
        .select({ slug: articles.slug })
        .from(schema.articles)
        .where(eq(articles.locale, locale))
        .all()
        .then(rows => rows.map(r => r.slug))
    },

    async reserveUniqueSlug(baseSlug: string, locale: string) {
      return reserveUniqueSlugInLocale(baseSlug, locale, async (slug, loc) => {
        const existing = await db
          .select({ id: articles.id })
          .from(schema.articles)
          .where(and(eq(articles.slug, slug), eq(articles.locale, loc)))
          .get()
        return existing !== undefined
      })
    },

    insert(values: typeof schema.articles.$inferInsert) {
      return db.insert(schema.articles).values(values).returning().get()
    },

    updateById(id: number, updates: ArticleUpdatePatch) {
      return db.update(schema.articles).set(updates).where(eq(articles.id, id)).returning().get()
    },

    softDelete(id: number) {
      return db
        .update(schema.articles)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(articles.id, id))
    },
  }
}
