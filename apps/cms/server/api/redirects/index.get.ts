import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const pagination = parsePagination(getQuery(event) as Record<string, string>)
  return useQueries(event).redirects.listPage({ pagination })
})
