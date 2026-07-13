import { createCategoryQueries } from '../../db/queries/categories'
import { parsePagination } from '../../utils/pagination'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const db = useDb(event)
  const pagination = parsePagination(query as Record<string, string>)

  return createCategoryQueries(db).listPage({
    locale,
    scope: 'public',
    pagination,
  })
})
