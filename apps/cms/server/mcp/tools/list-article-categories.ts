import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'List article categories (blog taxonomy)',
  inputSchema: {
    locale: z.string().default('fr').describe('Locale filter'),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(50),
  },
  enabled: event => mcpWriteToolEnabled(event, 'articles'),
  handler: async ({ locale, page, pageSize }) => {
    requireActorFromContext(useEvent(), 'articles')
    const { categoryArticles } = useQueries(useEvent())
    return categoryArticles.listPage({
      locale,
      scope: 'admin',
      pagination: {
        page,
        pageSize,
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
    })
  },
})
