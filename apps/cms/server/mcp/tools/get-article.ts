import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Get one article by id (includes writable=false when published)',
  inputSchema: {
    id: z.number().int().positive(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'articles'),
  handler: async ({ id }) => {
    requireActorFromContext(useEvent(), 'articles')
    const { articles } = useQueries(useEvent())
    const row = await articles.findById(id, ['category', 'seo'], 'admin')
    if (!row) {
      throw createApiError('NOT_FOUND', 'Article introuvable.')
    }
    return {
      ...row,
      writable: row.status === 'draft',
    }
  },
})
