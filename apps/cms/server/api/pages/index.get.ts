import { validateQuery } from '../../utils/validate'
import { parsePagination } from '../../utils/pagination'
import { PAGES_RELATIONS } from '../../db/queries/_shared/builders/pages'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { pages } = useQueries(event)

  const { include } = validateQuery(
    query as Record<string, string>,
    [...PAGES_RELATIONS],
  )
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)
  const session = await getUserSession(event)

  return pages.listPage({
    include,
    locale,
    isAuthenticated: !!session.user,
    pagination,
  })
})
