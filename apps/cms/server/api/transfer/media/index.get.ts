import { requireApiKey } from '../../../utils/api-key-auth'
import { useDb } from '../../../utils/db'
import {
  createTransferExportQueries,
  parseMediaTransferPage,
} from '../../../services/transfer-export'

export default defineEventHandler(async (event) => {
  await requireApiKey(event, 'media')
  const { limit, cursor } = parseMediaTransferPage(getQuery(event) as Record<string, unknown>)
  const page = await createTransferExportQueries(useDb(event)).exportMediaPage({
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
