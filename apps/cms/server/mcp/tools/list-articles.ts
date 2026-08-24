import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import {
  MCP_READ_ONLY,
  mcpContentStatusInput,
  mcpListInput,
  mcpPagination,
  withWritableList,
} from '../utils/payload'

export default defineMcpTool({
  description: 'List articles (all statuses). Each row includes writable (true only for drafts).',
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
    return withWritableList(result)
  },
})
