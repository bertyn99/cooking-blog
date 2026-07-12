import { db, schema } from 'hub:db'
import { sql, desc } from 'drizzle-orm'
import { parsePagination, paginateResult } from '../../utils/pagination'
import { buildRecipesWhere, buildRecipesWith } from '../../utils/queries/recipes'

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

  const where = buildRecipesWhere({ include, filters, isAuthenticated })
  const withObj = buildRecipesWith(include)

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(schema.recipes).where(where).all()
  const total = countResult[0]?.count ?? 0
  const { offset, limit, page, pageSize } = parsePagination(query as Record<string, string>)

  const rows = await db.query.recipes.findMany({
    where,
    with: withObj,
    orderBy: [desc(schema.recipes.publishedAt)],
    limit,
    offset,
  })

  return paginateResult(rows, total, page, pageSize)
})
