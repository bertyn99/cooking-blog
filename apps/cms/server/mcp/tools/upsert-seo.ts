import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import { seoBodySchema, upsertSeoMutation } from '../../services/seo-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Upsert SEO metadata for a draft article, recipe, or page',
  inputSchema: {
    contentType: z.enum(['article', 'recipe', 'page']),
    contentId: z.number().int().positive(),
    description: z.string().optional(),
    keywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    metaRobots: z.string().optional(),
  },
  enabled: (event) => {
    return mcpWriteToolEnabled(event, 'articles')
      || mcpWriteToolEnabled(event, 'recipes')
      || mcpWriteToolEnabled(event, 'pages')
  },
  handler: async ({ contentType, contentId, ...seo }) => {
    const event = useEvent()
    const scope = contentType === 'article'
      ? 'articles'
      : contentType === 'recipe'
        ? 'recipes'
        : 'pages'
    const actor = requireActorFromContext(event, scope)
    const body = validateBody(seoBodySchema, seo)
    return upsertSeoMutation(event, actor, contentType, contentId, body, { tool: 'upsert-seo' })
  },
})
