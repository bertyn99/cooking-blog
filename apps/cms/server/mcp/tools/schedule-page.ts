import { MCP_SCHEDULE, mcpIdInput, mcpScheduledAtInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpSchedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpPageResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Plan when a CMS page goes live: status becomes scheduled and the 5-min cron publishes it automatically. Accepts an ISO datetime or a YYYY-MM-DD day (published at 09:00 Europe/Paris). Forbidden on already-published pages (publishing stays manual). Requires the schedule key scope. Returns the updated page.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpScheduledAtInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'pages'),
  handler: async ({ id, scheduledAt }) => {
    await runMcpSchedule('pages', 'pages', id, scheduledAt, 'schedule-page')
    const { event } = requireMcpTool('pages')
    return mcpPageResult(event, id)
  },
})
