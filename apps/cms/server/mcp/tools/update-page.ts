import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  updatePageMutation,
  updatePageSchema,
} from '../../services/page-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Update a draft page only',
  annotations: { readOnlyHint: false, idempotentHint: true },
  inputSchema: {
    id: z.number().int().positive(),
    name: z.string().min(1).optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    parentId: z.number().nullable().optional(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'pages'),
  handler: async ({ id, ...patch }) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'pages')
    const data = validateBody(updatePageSchema, patch)
    return updatePageMutation(event, actor, id, data, { tool: 'update-page' })
  },
})
