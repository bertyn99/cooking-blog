import { requireMcpTool } from '../utils/actor'
import { mcpArticleResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one article by id. writable is true for every status. Includes previewUrl.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('articles')
    return mcpArticleResult(event, id)
  },
})
