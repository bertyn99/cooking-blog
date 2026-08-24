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
  description: 'List recipes (all statuses, category only). Use get-recipe for ingredients/steps. Each row includes writable.',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    ...mcpListInput,
    ...mcpContentStatusInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ locale, page, pageSize, search, status }) => {
    const { event } = requireMcpTool('recipes')
    const result = await useQueries(event).recipes.listPage({
      isAuthenticated: true,
      include: ['category'],
      filters: { locale, search, status },
      pagination: mcpPagination(page, pageSize),
    })
    return withWritableList(result)
  },
})
