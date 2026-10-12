import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { seoBodySchema, upsertSeoMutation } from '../../services/seo-mutations'
import { requireMcpTool } from '../utils/actor'
import { mcpAnyContentToolEnabled } from '../utils/enabled'
import { MCP_UPDATE, contentTypeToScope } from '../utils/payload'

export default defineMcpTool({
  description: 'Upsert SEO metadata for an article, recipe, page, or glossary term. Articles and pages may be live; recipes and glossary terms stay drafts unless a human publishes. Returns the SEO row.',
  annotations: MCP_UPDATE,
  inputSchema: {
    contentType: z.enum(['article', 'recipe', 'page', 'glossary']).describe('Target collection'),
    contentId: z.number().int().positive().describe('Target row id'),
    ...seoBodySchema.shape,
  },
  enabled: event => mcpAnyContentToolEnabled(event, ['articles', 'recipes', 'pages', 'glossary']),
  handler: async ({ contentType, contentId, ...seo }) => {
    const scope = contentTypeToScope(contentType)
    const { event, actor } = requireMcpTool(scope)
    const body = validateBody(seoBodySchema, seo)
    return upsertSeoMutation(event, actor, contentType, contentId, body, { tool: 'upsert-seo' })
  },
})
