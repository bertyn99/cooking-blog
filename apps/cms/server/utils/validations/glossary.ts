import { z } from 'zod'
import { GLOSSARY_KINDS } from '../../../shared/glossary-normalize'
import { GLOSSARY_ICON_KEYS } from '../../../shared/glossary-icons'
import { GLOSSARY_UTENSIL_CATEGORIES } from '../../../shared/glossary-icons'

const aliasSchema = z.object({
  alias: z.string().min(1),
  locale: z.string().default('fr'),
})

export const createGlossaryTermSchema = z.object({
  kind: z.enum(GLOSSARY_KINDS),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  coverBlobPathname: z.string().nullable().optional(),
  coverAltText: z.string().nullable().optional(),
  coverDescription: z.string().nullable().optional(),
  iconKey: z.enum(GLOSSARY_ICON_KEYS).nullable().optional(),
  utensilCategory: z.enum(GLOSSARY_UTENSIL_CATEGORIES).nullable().optional(),
  brand: z.string().nullable().optional(),
  amazonAsin: z.string().nullable().optional(),
  partnerUrl: z.string().nullable().optional(),
  partnerName: z.string().nullable().optional(),
  relatedArticleId: z.number().int().positive().nullable().optional(),
  parentId: z.number().int().positive().nullable().optional(),
  locale: z.string().default('fr'),
  status: z.enum(['draft', 'published']).optional(),
  aliases: z.array(aliasSchema).optional(),
})

export const updateGlossaryTermSchema = createGlossaryTermSchema.partial().extend({
  kind: z.enum(GLOSSARY_KINDS).optional(),
  name: z.string().min(1).optional(),
})
