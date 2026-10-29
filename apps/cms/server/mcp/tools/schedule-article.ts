import { MCP_SCHEDULE, mcpIdInput, mcpScheduledAtInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpSchedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpArticleResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Plan when an article goes live: status becomes scheduled and the 5-min cron publishes it automatically. Accepts an ISO datetime or a YYYY-MM-DD day (published at 09:00 Europe/Paris). Forbidden on already-published articles (publishing stays manual). Requires the schedule key scope. Returns the updated article.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpScheduledAtInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'articles'),
  handler: async ({ id, scheduledAt }) => {
    await runMcpSchedule('articles', 'articles', id, scheduledAt, 'schedule-article')
    const { event } = requireMcpTool('articles')
    return mcpArticleResult(event, id)
  },
})
