import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)
  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'

  return useQueries(event).categories.listPage({
    locale,
    scope,
    pagination,
  })
})
