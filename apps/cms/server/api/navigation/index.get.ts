import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const locale = (getQuery(event).locale as string) || 'fr'
  const items = await useQueries(event).navigation.listByLocale(locale)
  return { data: items }
})
