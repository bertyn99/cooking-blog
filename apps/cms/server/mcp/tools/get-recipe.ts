import { requireMcpTool } from '../utils/actor'
import { mcpRecipeResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one recipe by id (ingredients, steps, nutrition, utensils). Check writable before update. Includes previewUrl.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('recipes')
    return mcpRecipeResult(event, id)
  },
})
