import { validateBody } from '../../utils/validate'
import {
  updatePageMutation,
  updatePageSchema,
} from '../../services/page-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpPageResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdatePageInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a CMS page in any status. Does not publish or unpublish. Returns previewUrl.',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdatePageInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('pages')
    const data = validateBody(updatePageSchema, patch)
    await updatePageMutation(event, actor, id, data, { tool: 'update-page' })
    return mcpPageResult(event, id)
  },
})
