import { validateBody } from '../../utils/validate'
import {
  updatePageMutation,
  updatePageSchema,
} from '../../services/page-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdatePageInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a draft page only (403 if published)',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdatePageInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('pages')
    const data = validateBody(updatePageSchema, patch)
    return updatePageMutation(event, actor, id, data, { tool: 'update-page' })
  },
})
