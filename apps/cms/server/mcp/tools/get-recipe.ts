import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireActorFromContext } from '../../utils/write-auth'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Get one recipe by id (includes writable flag)',
  inputSchema: {
    id: z.number().int().positive(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'recipes'),
  handler: async ({ id }) => {
    requireActorFromContext(useEvent(), 'recipes')
    const { recipes } = useQueries(useEvent())
    const row = await recipes.findById(id, ['category', 'ingredients', 'steps', 'nutrition', 'seo'], 'admin')
    if (!row) {
      throw createApiError('NOT_FOUND', 'Recette introuvable.')
    }
    return {
      ...row,
      writable: row.status === 'draft',
    }
  },
})
