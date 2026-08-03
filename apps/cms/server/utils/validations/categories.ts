import { z } from 'zod'

// --- Recipe categories (table: categories) --------------------------------

export const createRecipeCategorySchema = z.object({
  name: z.string().min(1),
  desc: z.string().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('published'),
  publishedAt: z.string().optional(),
})

export const updateRecipeCategorySchema = z.object({
  name: z.string().min(1).optional(),
  desc: z.string().nullable().optional(),
  slug: z.string().min(1).optional(),
  locale: z.string().optional(),
  localeGroupId: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  publishedAt: z.string().nullable().optional(),
})

// --- Article categories (table: category_articles) ------------------------

export const createArticleCategorySchema = z.object({
  name: z.string().min(1),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('published'),
  publishedAt: z.string().optional(),
})

export const updateArticleCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  locale: z.string().optional(),
  localeGroupId: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  publishedAt: z.string().nullable().optional(),
})
