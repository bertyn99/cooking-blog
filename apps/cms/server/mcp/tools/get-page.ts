import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Get one page by id (includes writable flag)',
  inputSchema: {
    id: z.number().int().positive(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'pages'),
  handler: async ({ id }) => {
    requireActorFromContext(useEvent(), 'pages')
    const { pages } = useQueries(useEvent())
    const row = await pages.findById(id, ['seo'], 'admin')
    if (!row) {
      throw createApiError('NOT_FOUND', 'Page not found')
    }
    return {
      ...row,
      writable: row.status === 'draft',
    }
  },
})
