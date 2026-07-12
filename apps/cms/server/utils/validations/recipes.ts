import { z } from 'zod'

export const createRecipeSchema = z.object({
  title: z.string().min(1),
  intro: z.string().optional(),
  slug: z.string().optional(),
  categoryId: z.number().optional(),
  step: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  time: z.number().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
})

export const updateRecipeSchema = createRecipeSchema.partial()
