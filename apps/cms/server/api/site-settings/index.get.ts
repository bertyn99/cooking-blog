import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const siteSettings = useQueries(event).siteSettings
  const rows = await siteSettings.listAll()
  return { data: rows }
})
