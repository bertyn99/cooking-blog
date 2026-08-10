import { requireApiKey } from '../../../utils/api-key-auth'
import { useDb } from '../../../utils/db'
import {
  createTransferExportQueries,
  parseTransferPage,
} from '../../../services/transfer-export'

export default defineEventHandler(async (event) => {
  await requireApiKey(event, 'articles')
  const { limit, cursor } = parseTransferPage(getQuery(event) as Record<string, unknown>)
  const page = await createTransferExportQueries(useDb(event)).exportArticlesPage({
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
