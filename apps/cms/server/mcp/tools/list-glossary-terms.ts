import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import {
  MCP_READ_ONLY,
  mcpListInput,
  mcpPagination,
} from '../utils/payload'
import { mapMcpList } from '../utils/preview'
import { GLOSSARY_KINDS } from '../../../shared/glossary-normalize'

export default defineMcpTool({
  description: 'List glossary terms (all statuses). Create is always draft. Each row includes previewUrl.',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    ...mcpListInput,
    kind: z.enum(GLOSSARY_KINDS).optional().describe('ingredient | technique | ustensile'),
    status: z.enum(['draft', 'published']).optional().describe('Filter by status; omit to list all'),
    search: z.string().optional().describe('Name/slug/alias search'),
  },
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  handler: async ({ locale, page, pageSize, search, status, kind }) => {
    const { event } = requireMcpTool('glossary')
    const result = await useQueries(event).glossary.listPage({
      isAuthenticated: true,
      include: ['aliases'],
      filters: { locale, search, status, kind },
      pagination: mcpPagination(page, pageSize),
    })
    return mapMcpList(event, 'glossary', result)
  },
})
