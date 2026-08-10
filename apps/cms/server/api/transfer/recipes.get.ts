import { requireApiKey } from '../../utils/api-key-auth'
import { useQueries } from '../../utils/db'
import { parseTransferPage } from '../../services/transfer-export'

export default defineEventHandler(async (event) => {
  await requireApiKey(event, 'recipes')
  const { limit, cursor } = parseTransferPage(getQuery(event) as Record<string, unknown>)
  const page = await useQueries(event).transferExport.exportRecipesPage({
    cursor,
    limit,
  })
  return {
    data: page.items,
    related: page.related,
    meta: {
      nextCursor: page.nextCursor,
      limit,
      includeDrafts: true,
    },
  }
})
