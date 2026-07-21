import { createPageQueries } from '../../db/queries/pages'
import { validateQuery } from '../../utils/validate'
import { parsePagination } from '../../utils/pagination'
import { PAGES_RELATIONS } from '../../utils/queries/pages'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const db = useDb(event)

  const { include } = validateQuery(
    query as Record<string, string>,
    [...PAGES_RELATIONS],
  )
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)
  const session = await getUserSession(event)

  return createPageQueries(db).listPage({
    include,
    locale,
    isAuthenticated: !!session.user,
    pagination,
  })
})
