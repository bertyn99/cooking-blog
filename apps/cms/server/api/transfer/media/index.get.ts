import { requireApiKey } from '../../../utils/api-key-auth'
import { useQueries } from '../../../utils/db'
import { parseMediaTransferPage } from '../../../services/transfer-export'

export default defineEventHandler(async (event) => {
  await requireApiKey(event, 'media')
  const { limit, cursor } = parseMediaTransferPage(getQuery(event) as Record<string, unknown>)
  const page = await useQueries(event).transferExport.exportMediaPage({
    cursor,
    limit,
  })
  return {
    data: page.items,
    meta: {
      nextCursor: page.nextCursor,
      limit,
    },
  }
})
