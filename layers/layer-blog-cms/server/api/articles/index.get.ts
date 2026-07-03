import { db, schema } from 'hub:db'
import { sql, desc } from 'drizzle-orm'
import { parsePagination, paginateResult } from '../../utils/pagination'
import { buildArticlesWhere, buildArticlesWith } from '../../utils/queries/articles'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const isAuthenticated = !!event.context?.user

  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)
  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? parseInt(query.categoryId as string) : undefined,
    locale: query.locale as string | undefined,
  }
  if (!filters.slug) delete filters.slug
  if (isNaN(filters.categoryId as number)) delete filters.categoryId

  const where = buildArticlesWhere({ include, filters, isAuthenticated })
  const withObj = buildArticlesWith(include)

  const [{ count: total }] = await db.select({ count: sql<number>`count(*)` }).from(schema.articles).where(where).all()
  const { offset, limit, page, pageSize } = parsePagination(query as Record<string, string>)

  let dbQuery = db.select().from(schema.articles)
  if (where) dbQuery = dbQuery.where(where)

  const rows = await dbQuery
    .orderBy(desc(schema.articles.publishedAt))
    .limit(limit).offset(offset).all()

  return paginateResult(rows, total, page, pageSize)
})
