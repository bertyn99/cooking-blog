import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput, withWritable } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one page by id (seoMeta + parent). Check writable before update.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('pages')
    const row = await useQueries(event).pages.findById(id, ['seoMeta', 'parent'], 'admin')
    if (!row) {
      throw createApiError('NOT_FOUND', 'Page introuvable.')
    }
    return withWritable(row)
  },
})
