import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const query = getQuery(event)
  const pagination = parsePagination(query as Record<string, string>)
  return useQueries(event).tags.listPage({
    locale: (query.locale as string) || undefined,
    pagination,
  })
})
