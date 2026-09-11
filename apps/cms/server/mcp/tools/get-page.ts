import { requireMcpTool } from '../utils/actor'
import { mcpPageResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one page by id (seoMeta + parent). writable is true for every status. Includes previewUrl.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('pages')
    return mcpPageResult(event, id)
  },
})
