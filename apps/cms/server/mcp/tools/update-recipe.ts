import { validateBody } from '../../utils/validate'
import {
  updateRecipeMutation,
  updateRecipeSchema,
} from '../../services/recipe-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpRecipeResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdateRecipeInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a recipe in place — live recipes included (status changes stay forbidden: publishing stays manual). Accepts ingredients, steps, utensils, nutrition. Returns previewUrl.',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdateRecipeInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('recipes')
    const data = validateBody(updateRecipeSchema, patch)
    await updateRecipeMutation(event, actor, id, data, { tool: 'update-recipe' })
    return mcpRecipeResult(event, id)
  },
})
