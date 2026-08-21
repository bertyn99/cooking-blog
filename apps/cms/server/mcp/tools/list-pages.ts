import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'List CMS pages (all statuses)',
  inputSchema: {
    locale: z.string().default('fr'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(20),
  },
  enabled: event => mcpWriteToolEnabled(event, 'pages'),
  handler: async ({ locale, page, pageSize }) => {
    requireActorFromContext(useEvent(), 'pages')
    const { pages } = useQueries(useEvent())
    return pages.listPage({
      isAuthenticated: true,
      locale,
      pagination: {
        page,
        pageSize,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    })
  },
})
