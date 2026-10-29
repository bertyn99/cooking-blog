import { MCP_SCHEDULE, mcpIdInput, mcpScheduledAtInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpSchedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpRecipeResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Plan when a recipe goes live: status becomes scheduled and the 5-min cron publishes it automatically. Accepts an ISO datetime or a YYYY-MM-DD day (published at 09:00 Europe/Paris). Forbidden on already-published recipes (publishing stays manual). Requires the schedule key scope. Returns the updated recipe.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpScheduledAtInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'recipes'),
  handler: async ({ id, scheduledAt }) => {
    await runMcpSchedule('recipes', 'recipes', id, scheduledAt, 'schedule-recipe')
    const { event } = requireMcpTool('recipes')
    return mcpRecipeResult(event, id)
  },
})
