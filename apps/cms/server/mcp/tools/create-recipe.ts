import { z } from 'zod'
import { validateBody } from '../../utils/validate'
import { requireActorFromContext } from '../../utils/write-auth'
import {
  createRecipeMutation,
  createRecipeSchema,
} from '../../services/recipe-mutations'
import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpTool({
  description: 'Create a draft recipe',
  annotations: { readOnlyHint: false, idempotentHint: false },
  inputSchema: {
    title: z.string().min(1),
    intro: z.string().optional(),
    excerpt: z.string().optional(),
    categoryId: z.number().optional(),
    locale: z.string().default('fr'),
    prepTimeMinutes: z.number().int().positive().optional(),
    cookTimeMinutes: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  },
  enabled: event => mcpWriteToolEnabled(event, 'recipes'),
  handler: async (input) => {
    const event = useEvent()
    const actor = requireActorFromContext(event, 'recipes')
    const data = validateBody(createRecipeSchema, { ...input, status: 'draft' })
    return createRecipeMutation(event, actor, data, { tool: 'create-recipe' })
  },
})
