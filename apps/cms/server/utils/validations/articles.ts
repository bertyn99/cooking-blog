import { z } from 'zod'

export const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  slug: z.string().optional(),
  categoryId: z.number().optional(),
  coverBlobPathname: z.string().nullable().optional(),
  coverAltText: z.string().nullable().optional(),
  coverDescription: z.string().nullable().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
})

export const updateArticleSchema = createArticleSchema.partial()
