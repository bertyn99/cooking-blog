import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { serializeRecipeForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user
  const scope = isAuthenticated ? 'admin' : 'public'
  const { recipes } = useQueries(event)

  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)
  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? Number.parseInt(query.categoryId as string, 10) : undefined,
    locale: query.locale as string | undefined,
  }
  if (!filters.slug) delete filters.slug
  if (Number.isNaN(filters.categoryId as number)) delete filters.categoryId

  const pagination = parsePagination(query as Record<string, string>)

  const page = await recipes.listPage({
    include,
    filters,
    isAuthenticated,
    pagination,
  })

  return {
    ...page,
    data: page.data.map(row => serializeRecipeForScope(row, scope)),
  }
})
