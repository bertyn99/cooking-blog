import { z } from 'zod'

const ingredientUnitSchema = z.enum(['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'])

export const ingredientSchema = z.object({
  name: z.string(),
  qty: z.number().optional(),
  unit: ingredientUnitSchema.optional(),
  sortOrder: z.number().optional(),
})

export const nutritionSchema = z.object({
  lipides: z.string().optional(),
  proteine: z.string().optional(),
  sucre: z.string().optional(),
  calories: z.string().optional(),
  glucides: z.string().optional(),
  sodium: z.string().optional(),
})

export const createRecipeSchema = z.object({
  title: z.string().min(1),
  intro: z.string().optional(),
  slug: z.string().optional(),
  categoryId: z.number().optional(),
  step: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  time: z.number().optional(),
  coverBlobPathname: z.string().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  nutrition: nutritionSchema.optional(),
})

export const updateRecipeSchema = createRecipeSchema.partial()
