import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'List recipes (all statuses)',
  inputSchema: {
    locale: z.string().default('fr'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(50).default(20),
    search: z.string().optional(),
    status: z.enum(['draft', 'published', 'scheduled']).optional(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'recipes'),
  handler: async ({ locale, page, pageSize, search, status }) => {
    requireActorFromContext(useEvent(), 'recipes')
    const { recipes } = useQueries(useEvent())
    return recipes.listPage({
      isAuthenticated: true,
      include: ['category', 'ingredients', 'steps'],
      filters: { locale, search, status },
      pagination: {
        page,
        pageSize,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    })
  },
})
