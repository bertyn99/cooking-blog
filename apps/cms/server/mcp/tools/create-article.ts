import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  createArticleMutation,
  createArticleSchema,
} from '../../services/article-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Create a draft article (Comark markdown in content)',
  annotations: { readOnlyHint: false, idempotentHint: false },
  inputSchema: {
    title: z.string().min(1),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    categoryId: z.number().optional(),
    locale: z.string().default('fr'),
  },
  enabled: event => mcpWriteToolEnabled(event, 'articles'),
  handler: async (input) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'articles')
    const data = validateBody(createArticleSchema, { ...input, status: 'draft' })
    return createArticleMutation(event, actor, data, { tool: 'create-article' })
  },
})
