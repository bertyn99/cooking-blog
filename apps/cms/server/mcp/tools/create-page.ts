import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  createPageMutation,
  createPageSchema,
} from '../../services/page-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Create a draft CMS page',
  annotations: { readOnlyHint: false, idempotentHint: false },
  inputSchema: {
    name: z.string().min(1),
    title: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    parentId: z.number().nullable().optional(),
    locale: z.string().default('fr'),
  },
  enabled: event => mcpWriteToolEnabled(event, 'pages'),
  handler: async (input) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'pages')
    const data = validateBody(createPageSchema, { ...input, status: 'draft' })
    return createPageMutation(event, actor, data, { tool: 'create-page' })
  },
})
