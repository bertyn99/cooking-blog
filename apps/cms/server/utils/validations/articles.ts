import { z } from 'zod'

export const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  slug: z.string().optional(),
  categoryId: z.number().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
})

export const updateArticleSchema = createArticleSchema.partial()
