import { parseInclude } from '../../utils/populate'
import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { serializeArticleForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { articles } = useQueries(event)
  const session = await getUserSession(event)
  const isAuthenticated = !!session.user
  const scope = isAuthenticated ? 'admin' : 'public'

  const include = parseInclude(query as Record<string, unknown>)
  const filters = {
    slug: query.slug as string | undefined,
    categoryId: query.categoryId ? Number.parseInt(query.categoryId as string, 10) : undefined,
    locale: query.locale as string | undefined,
  }

  if (!filters.slug) delete filters.slug
  if (Number.isNaN(filters.categoryId)) delete filters.categoryId

  const page = await articles.listPage({
    include,
    filters,
    isAuthenticated,
    pagination: parsePagination(query as Record<string, string>),
  })

  return {
    ...page,
    data: page.data.map(row => serializeArticleForScope(row, scope)),
  }
})
