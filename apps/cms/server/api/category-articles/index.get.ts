import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)

  return useQueries(event).categoryArticles.listPage({
    locale,
    scope: 'public',
    pagination,
  })
})
