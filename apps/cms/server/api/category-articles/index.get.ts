/**
 * GET /api/category-articles — List article categories with locale filtering and pagination.
 *
 * Query params:
 * - locale   (string)  → filter by locale (default: no filter)
 * - page     (number)  → page number (default: 1)
 * - pageSize (number)  → items per page (default: 10, max: 100)
 *
 * Draft protection: unauthenticated requests only see categories with
 * status='published' and deletedAt IS NULL.
 */
import { db, schema } from 'hub:db'
import { sql, eq, and, isNull } from 'drizzle-orm'
import { parsePagination, paginateResult } from '../../utils/pagination'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const isAuthenticated = !!event.context?.user

  // Build where conditions
  const conditions = []

  // Draft protection
  if (!isAuthenticated) {
    conditions.push(eq(schema.categoryArticles.status, 'published'))
    conditions.push(isNull(schema.categoryArticles.deletedAt))
  }

  // Locale filter
  if (locale) {
    conditions.push(eq(schema.categoryArticles.locale, locale))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  // Count total
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.categoryArticles)
    .where(where)
    .all()

  // Paginate
  const { offset, limit, page, pageSize } = parsePagination(query as Record<string, string>)

  let dbQuery = db.select().from(schema.categoryArticles)
  if (where) {
    dbQuery = dbQuery.where(where)
  }

  const rows = await dbQuery
    .orderBy(sql`${schema.categoryArticles.createdAt} DESC`)
    .limit(limit)
    .offset(offset)
    .all()

  return paginateResult(rows, total, page, pageSize)
})
