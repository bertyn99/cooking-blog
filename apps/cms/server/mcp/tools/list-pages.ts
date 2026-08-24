import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import {
  MCP_READ_ONLY,
  mcpListInput,
  mcpPagination,
  withWritableList,
} from '../utils/payload'

export default defineMcpTool({
  description: 'List CMS pages (all statuses). Each row includes writable.',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    ...mcpListInput,
    parentId: z.number().int().positive().optional().describe('Filter by parent page id'),
  },
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async ({ locale, page, pageSize, parentId }) => {
    const { event } = requireMcpTool('pages')
    const result = await useQueries(event).pages.listPage({
      isAuthenticated: true,
      include: ['parent'],
      locale,
      filters: parentId ? { parentId } : undefined,
      pagination: mcpPagination(page, pageSize),
    })
    return withWritableList(result)
  },
})
