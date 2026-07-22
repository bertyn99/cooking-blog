import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { serializeRecipeForScope } from '../../utils/serialize-content'
import { resolveRecipeCategoryIds } from '../../utils/resolve-category-ids'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user
  const scope = isAuthenticated ? 'admin' : 'public'
  const { recipes } = useQueries(event)

  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)
  const categoryNames = (query.categoryNames as string | undefined)
    ?.split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const categoryIds = await resolveRecipeCategoryIds(event, {
    names: categoryNames,
    slug: query.categorySlug as string | undefined,
  })

  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? Number.parseInt(query.categoryId as string, 10) : undefined,
    categoryIds: categoryIds?.length ? categoryIds : undefined,
    locale: query.locale as string | undefined,
    search: (query.search as string) || undefined,
  }
  if (!filters.slug) delete filters.slug
  if (Number.isNaN(filters.categoryId as number)) delete filters.categoryId
  if (!filters.search) delete filters.search

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
