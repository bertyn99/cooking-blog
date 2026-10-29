import { MCP_SCHEDULE, mcpIdInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpUnschedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpArticleResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Cancel a planned publication: a scheduled article goes back to draft and scheduledAt is cleared. Refuses published articles (unpublish stays manual in the admin). Requires the schedule key scope. Returns the updated article.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'articles'),
  handler: async ({ id }) => {
    await runMcpUnschedule('articles', 'articles', id, 'unschedule-article')
    const { event } = requireMcpTool('articles')
    return mcpArticleResult(event, id)
  },
})
