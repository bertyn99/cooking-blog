import { validateBody } from '../../utils/validate'
import {
  updateArticleMutation,
  updateArticleSchema,
} from '../../services/article-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpArticleResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, mcpIdInput, mcpUpdateArticleInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Update an article in any status (draft, published, or scheduled). Does not publish or unpublish. Returns previewUrl.',
  annotations: MCP_UPDATE,
  inputSchema: {
    ...mcpIdInput,
    ...mcpUpdateArticleInput,
  },
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async ({ id, ...patch }) => {
    const { event, actor } = requireMcpTool('articles')
    const data = validateBody(updateArticleSchema, patch)
    await updateArticleMutation(event, actor, id, data, { tool: 'update-article' })
    return mcpArticleResult(event, id)
  },
})
