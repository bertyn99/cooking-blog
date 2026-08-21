import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  updateArticleMutation,
  updateArticleSchema,
} from '../../services/article-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Update a draft article only (403 if published)',
  annotations: { readOnlyHint: false, idempotentHint: true },
  inputSchema: {
    id: z.number().int().positive(),
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    categoryId: z.number().optional(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'articles'),
  handler: async ({ id, ...patch }) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'articles')
    const data = validateBody(updateArticleSchema, patch)
    return updateArticleMutation(event, actor, id, data, { tool: 'update-article' })
  },
})
