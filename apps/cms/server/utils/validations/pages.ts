import { z } from 'zod'

const pageStatusSchema = z.enum(['draft', 'published', 'scheduled'])

export const createPageSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  parentId: z.number().nullable().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: pageStatusSchema.optional(),
  scheduledAt: z.string().optional(),
})

export const updatePageSchema = createPageSchema.partial()
