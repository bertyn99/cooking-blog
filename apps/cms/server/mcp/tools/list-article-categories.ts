import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpListInput, mcpPagination } from '../utils/payload'

export default defineMcpTool({
  description: 'List article categories (blog taxonomy). Call before setting categoryId on an article.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpListInput,
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ locale, page, pageSize }) => {
    const { event } = requireMcpTool('articles')
    return useQueries(event).categoryArticles.listPage({
      locale,
      scope: 'admin',
      pagination: mcpPagination(page, pageSize),
    })
  },
})
