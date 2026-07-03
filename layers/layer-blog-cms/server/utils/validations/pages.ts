import { z } from 'zod'

export const createPageSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  content: z.string().optional(),
  parentId: z.number().nullable().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
})

export const updatePageSchema = createPageSchema.partial()
