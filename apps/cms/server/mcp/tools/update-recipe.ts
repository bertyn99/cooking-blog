import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  updateRecipeMutation,
  updateRecipeSchema,
} from '../../services/recipe-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Update a draft recipe only',
  annotations: { readOnlyHint: false, idempotentHint: true },
  inputSchema: {
    id: z.number().int().positive(),
    title: z.string().min(1).optional(),
    intro: z.string().optional(),
    excerpt: z.string().optional(),
    categoryId: z.number().optional(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'recipes'),
  handler: async ({ id, ...patch }) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'recipes')
    const data = validateBody(updateRecipeSchema, patch)
    return updateRecipeMutation(event, actor, id, data, { tool: 'update-recipe' })
  },
})
