import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireMcpMediaTool } from '../utils/actor'
import { mcpMediaListEnabled } from '../utils/enabled'
import { MCP_READ_ONLY } from '../utils/payload'

export default defineMcpTool({
  description: 'List media metadata at a folder prefix (write + media scopes). Use pathname as coverBlobPathname. One folder level, paginated.',
  annotations: MCP_READ_ONLY,
  inputSchema: {
    prefix: z.string().default('').describe('Folder prefix, e.g. recipes/ or empty for root'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(30),
  },
  enabled: event => mcpMediaListEnabled(event),
  handler: async ({ prefix, page, pageSize }) => {
    const { event } = requireMcpMediaTool()
    const offset = (page - 1) * pageSize
    const rows = await useQueries(event).blobs.listGalleryFiles(prefix, pageSize + 1, offset)
    const hasMore = rows.length > pageSize
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows
    return {
      data: pageRows,
      meta: { pagination: { page, pageSize, hasMore, prefix } },
    }
  },
})
