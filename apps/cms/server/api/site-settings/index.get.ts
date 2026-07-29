import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { canAccessAdminApi } from '../../../shared/abilities'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const rows = await useQueries(event).siteSettings.listAll()
  return { data: rows }
})
