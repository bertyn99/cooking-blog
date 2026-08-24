import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpListInput, mcpPagination } from '../utils/payload'

export default defineMcpTool({
  description: 'List recipe categories. Call before setting categoryId on a recipe.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpListInput,
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ locale, page, pageSize }) => {
    const { event } = requireMcpTool('recipes')
    return useQueries(event).categories.listPage({
      locale,
      scope: 'admin',
      pagination: mcpPagination(page, pageSize),
    })
  },
})
