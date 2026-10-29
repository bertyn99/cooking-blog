import { MCP_SCHEDULE, mcpIdInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpUnschedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpRecipeResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Cancel a planned publication: a scheduled recipe goes back to draft and scheduledAt is cleared. Refuses published recipes (unpublish stays manual in the admin). Requires the schedule key scope. Returns the updated recipe.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'recipes'),
  handler: async ({ id }) => {
    await runMcpUnschedule('recipes', 'recipes', id, 'unschedule-recipe')
    const { event } = requireMcpTool('recipes')
    return mcpRecipeResult(event, id)
  },
})
