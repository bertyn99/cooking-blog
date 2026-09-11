import { validateBody } from '../../utils/validate'
import {
  createArticleMutation,
  createArticleSchema,
} from '../../services/article-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpArticleResult } from '../utils/content-result'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreateArticleInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a draft article (Comark markdown in content). Never publishes. Returns previewUrl.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreateArticleInput,
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async (input) => {
    const { event, actor } = requireMcpTool('articles')
    const data = validateBody(createArticleSchema, { ...input, status: 'draft' })
    const created = await createArticleMutation(event, actor, data, { tool: 'create-article' })
    return mcpArticleResult(event, created.id)
  },
})
