/**
 * GET /api/pages/[id] — Get a single page with optional parent hierarchy.
 *
 * Query params:
 * - include (string) → comma-separated relations: content, seoMeta, parent (or '*')
 *
 * Draft protection: unauthenticated users can only view published + non-deleted pages.
 * Returns 404 if the page is not found or is a draft for unauthenticated users.
 */
import { db } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'
import { pages } from '../../db/schema/pages'
import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { PAGES_RELATIONS, buildPagesWith } from '../../utils/queries/pages'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const query = getQuery(event)
  const includeList = parseInclude(query as Record<string, string>)

  // Validate includes
  if (!includeList.includes('*')) {
    const invalid = includeList.filter(
      (r) => !(PAGES_RELATIONS as readonly string[]).includes(r),
    )
    if (invalid.length) {
      throw createApiError('VALIDATION_ERROR', `Invalid includes: ${invalid.join(', ')}`)
    }
  }

  const isAuthenticated = !!event.context?.user

  // Build where conditions
  const whereConditions = [eq(pages.id, id)]

  // Draft protection
  if (!isAuthenticated) {
    whereConditions.push(eq(pages.status, 'published'))
    whereConditions.push(isNull(pages.deletedAt))
  }

  const withObj = buildPagesWith(includeList)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery: any = db.select().from(pages).where(and(...whereConditions))

  if (withObj) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    dbQuery = dbQuery.with(withObj)
  }

  const rows = await dbQuery.limit(1)
  const page = rows[0]

  if (!page) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  return { data: page }
})
