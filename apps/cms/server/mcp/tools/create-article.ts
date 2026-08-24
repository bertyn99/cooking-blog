import { validateBody } from '../../utils/validate'
import {
  createArticleMutation,
  createArticleSchema,
} from '../../services/article-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpContentToolEnabled } from '../utils/enabled'
import { MCP_CREATE, mcpCreateArticleInput } from '../utils/payload'

export default defineMcpTool({
  description: 'Create a draft article (Comark markdown in content). Never publishes.',
  annotations: MCP_CREATE,
  inputSchema: mcpCreateArticleInput,
  enabled: event => mcpContentToolEnabled(event, 'articles'),
  handler: async (input) => {
    const { event, actor } = requireMcpTool('articles')
    const data = validateBody(createArticleSchema, { ...input, status: 'draft' })
    return createArticleMutation(event, actor, data, { tool: 'create-article' })
  },
})
