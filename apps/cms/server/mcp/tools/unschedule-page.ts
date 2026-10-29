import { MCP_SCHEDULE, mcpIdInput } from '../utils/payload'
import { mcpScheduleToolEnabled } from '../utils/enabled'
import { runMcpUnschedule } from '../utils/schedule'
import { requireMcpTool } from '../utils/actor'
import { mcpPageResult } from '../utils/content-result'

export default defineMcpTool({
  description: 'Cancel a planned publication: a scheduled page goes back to draft and scheduledAt is cleared. Refuses published pages (unpublish stays manual in the admin). Requires the schedule key scope. Returns the updated page.',
  annotations: MCP_SCHEDULE,
  inputSchema: {
    ...mcpIdInput,
  },
  enabled: event => mcpScheduleToolEnabled(event, 'pages'),
  handler: async ({ id }) => {
    await runMcpUnschedule('pages', 'pages', id, 'unschedule-page')
    const { event } = requireMcpTool('pages')
    return mcpPageResult(event, id)
  },
})
