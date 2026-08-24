import { validateBody } from '../../utils/validate'
import {
  updateArticleMutation,
  updateArticleSchema,
} from '../../services/article-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdateArticleInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update a draft article only (403 if published or scheduled)',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdateArticleInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('articles')
    const data = validateBody(updateArticleSchema, patch)
    return updateArticleMutation(event, actor, id, data, { tool: 'update-article' })
  },
})
