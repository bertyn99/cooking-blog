import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput, withWritable } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one recipe by id (ingredients, steps, nutrition, utensils). Check writable before update.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('recipes')
    const row = await useQueries(event).recipes.findById(
      id,
      'admin',
      ['category', 'ingredients', 'steps', 'nutrition', 'utensils', 'seo'],
    )
    if (!row) {
      throw createApiError('NOT_FOUND', 'Recette introuvable.')
    }
    return withWritable(row)
  },
})
