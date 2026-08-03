import { parsePagination } from '../../../utils/pagination'
import { useQueries } from '../../../utils/db'
import { requireAbility } from '../../../utils/http-auth'
import { canAccessAdminApi } from '../../../../shared/abilities'

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessAdminApi)

  const query = getQuery(event)
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)

  return useQueries(event).categoryArticles.listPage({
    locale,
    scope: 'admin',
    pagination,
  })
})
