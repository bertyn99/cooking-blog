/**
 * GET /api/pages — List pages with locale filtering, pagination, and relation population.
 *
 * Query params:
 * - locale   (string)  → filter by locale (default: no filter)
 * - include  (string)  → comma-separated relations: content, seoMeta, parent (or '*')
 * - page     (number)  → page number (default: 1)
 * - pageSize (number)  → items per page (default: 10, max: 100)
 *
 * Draft protection: unauthenticated requests only see pages with status='published'
 * and deletedAt IS NULL.
 */
import { db } from 'hub:db'
import { sql } from 'drizzle-orm'
import { pages } from '../../db/schema/pages'
import { validateQuery } from '../../utils/validate'
import { parsePagination, paginateResult } from '../../utils/pagination'
import { PAGES_RELATIONS, buildPagesWhere, buildPagesQueryWhere, buildPagesWith } from '../../utils/queries/pages'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Validate and parse query params
  const { include, page, pageSize } = validateQuery(
    query as Record<string, string>,
    [...PAGES_RELATIONS],
  )
  const locale = (query.locale as string) || undefined

  // Auth awareness
  const isAuthenticated = !!event.context?.user

  // Build where clause
  const where = buildPagesWhere({ include, locale, isAuthenticated })
  const queryWhere = buildPagesQueryWhere({ include, locale, isAuthenticated })
  const withObj = buildPagesWith(include)

  // Count total (without includes for performance)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(where)

  const total = countResult[0]?.count ?? 0

  const { offset, limit } = parsePagination(query as Record<string, string>)

  const rows = await db.query.pages.findMany({
    where: queryWhere,
    with: withObj,
    orderBy: { createdAt: 'desc' },
    limit,
    offset,
  })

  return paginateResult(rows, total, page, pageSize)
})
