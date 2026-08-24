import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput, withWritable } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one article by id. Check writable before update (false when live).',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('articles')
    const row = await useQueries(event).articles.findById(id, ['category', 'seo'], 'admin')
    if (!row) {
      throw createApiError('NOT_FOUND', 'Article introuvable.')
    }
    return withWritable(row)
  },
})
