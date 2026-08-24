import { validateBody } from '../../utils/validate'
import {
  updateRecipeMutation,
  updateRecipeSchema,
} from '../../services/recipe-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdateRecipeInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a draft recipe only (403 if published). Accepts ingredients, steps, utensils, nutrition.',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdateRecipeInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('recipes')
    const data = validateBody(updateRecipeSchema, patch)
    return updateRecipeMutation(event, actor, id, data, { tool: 'update-recipe' })
  },
})
