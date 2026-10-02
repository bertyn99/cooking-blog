import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import {
  MCP_READ_ONLY,
  mcpContentStatusInput,
  mcpListInput,
  mcpPagination,
} from '../utils/payload'
import { mapMcpList } from '../utils/preview'

export default defineMcpTool({
  description: 'List articles (all statuses). writable is true for every row. Each row includes previewUrl.',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    ...mcpListInput,
    ...mcpContentStatusInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ locale, page, pageSize, search, status }) => {
    const { event } = requireMcpTool('articles')
    const result = await useQueries(event).articles.listPage({
      isAuthenticated: true,
      include: ['category'],
      filters: { locale, search, status },
      pagination: mcpPagination(page, pageSize),
    })
    return mapMcpList(event, 'article', result, { liveEditable: true })
  },
})
