import { validateBody } from '../../utils/validate'
import {
  createPageMutation,
  createPageSchema,
} from '../../services/page-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreatePageInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a draft CMS page. Never publishes.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreatePageInput,
  enabled: event => mcpContentToolEnabled(event, 'pages'),
  handler: async (input) => {
    const { event, actor } = requireMcpTool('pages')
    const data = validateBody(createPageSchema, { ...input, status: 'draft' })
    return createPageMutation(event, actor, data, { tool: 'create-page' })
  },
})
