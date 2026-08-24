import { validateBody } from '../../utils/validate'
import {
  createRecipeMutation,
  createRecipeSchema,
} from '../../services/recipe-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreateRecipeInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a draft recipe (intro, ingredients, steps, utensils, nutrition). Never publishes.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreateRecipeInput,
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async (input) => {
    const { event, actor } = requireMcpTool('recipes')
    const data = validateBody(createRecipeSchema, { ...input, status: 'draft' })
    return createRecipeMutation(event, actor, data, { tool: 'create-recipe' })
  },
})
