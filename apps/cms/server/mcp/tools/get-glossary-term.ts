import { requireMcpTool } from '../utils/actor'
import { mcpGlossaryResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_READ_ONLY, mcpIdInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Get one glossary term by id (cover, SEO, aliases). Includes previewUrl. Never publishes.',
  annotations: MCP_READ_ONLY,
  inputSchema: mcpIdInput,
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  handler: async ({ id }) => {
    const { event } = requireMcpTool('glossary')
    return mcpGlossaryResult(event, id)
  },
})
