import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpMediaListEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'List media blob metadata (requires write + media scopes)',
  inputSchema: {
    prefix: z.string().default('').describe('Path prefix filter'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(30),
  },
  enabled: event => mcpMediaListEnabled(event),
  handler: async ({ prefix, page, pageSize }) => {
    requireActorFromContext(useEvent())
    const { blobs } = useQueries(useEvent())
    const offset = (page - 1) * pageSize
    const rows = prefix
      ? await blobs.listByPathPrefix(prefix)
      : await blobs.listGalleryFiles('', pageSize, offset)
    const slice = prefix ? rows.slice(offset, offset + pageSize) : rows
    return { data: slice, meta: { page, pageSize, count: slice.length } }
  },
})
