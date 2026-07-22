import { parseInclude } from '../../../utils/populate'
import { parsePagination } from '../../../utils/pagination'
import { useQueries } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { articles } = useQueries(event)

  const include = parseInclude(query as Record<string, unknown>)
  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? Number.parseInt(query.categoryId as string, 10) : undefined,
    locale: query.locale as string | undefined,
    status: query.status as 'draft' | 'published' | 'scheduled' | undefined,
    search: query.search as string | undefined,
  }

  if (!filters.slug) delete filters.slug
  if (Number.isNaN(filters.categoryId)) delete filters.categoryId

  return articles.listPage({
    include,
    filters,
    isAuthenticated: true,
    includeDeleted: query.includeDeleted === 'true',
    pagination: parsePagination(query as Record<string, string>),
  })
})
