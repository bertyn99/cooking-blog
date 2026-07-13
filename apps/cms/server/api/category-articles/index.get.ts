import { createCategoryArticleQueries } from '../../db/queries/category-articles'
import { parsePagination } from '../../utils/pagination'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const db = useDb(event)
  const pagination = parsePagination(query as Record<string, string>)

  return createCategoryArticleQueries(db).listPage({
    locale,
    scope: 'public',
    pagination,
  })
})
