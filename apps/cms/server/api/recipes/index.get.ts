import { createRecipeQueries } from '../../db/queries/recipes'
import { parsePagination } from '../../utils/pagination'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDb(event)
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user

  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)
  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? Number.parseInt(query.categoryId as string, 10) : undefined,
    locale: query.locale as string | undefined,
  }
  if (!filters.slug) delete filters.slug
  if (Number.isNaN(filters.categoryId as number)) delete filters.categoryId

  const pagination = parsePagination(query as Record<string, string>)

  return createRecipeQueries(db).listPage({
    include,
    filters,
    isAuthenticated,
    pagination,
  })
})
