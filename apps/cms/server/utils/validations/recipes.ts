import { z } from 'zod'

const ingredientUnitSchema = z.enum(['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'])

export const ingredientSchema = z.object({
  name: z.string(),
  qty: z.number().optional(),
  unit: ingredientUnitSchema.optional(),
  sortOrder: z.number().optional(),
})

export const recipeUtensilSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  affiliateUrl: z.string().optional(),
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

export const recipeStepSchema = z.object({
  title: z.string().optional(),
  instruction: z.string().min(1),
  sortOrder: z.number().optional(),
})

/** FAQ structurée de la recette — rendue sur la page et en schema FAQPage. */
export const recipeFaqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
})

export const createRecipeSchema = z.object({
  title: z.string().min(1),
  intro: z.string().optional(),
  excerpt: z.string().optional(),
  featured: z.boolean().optional(),
  slug: z.string().optional(),
  categoryId: z.number().optional(),
  step: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  time: z.number().optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  cookTimeMinutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  faq: z.array(recipeFaqSchema).max(10).optional(),
  coverBlobPathname: z.string().optional(),
  coverAltText: z.string().nullable().optional(),
  coverDescription: z.string().nullable().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  utensils: z.array(recipeUtensilSchema).optional(),
  steps: z.array(recipeStepSchema).optional(),
  nutrition: nutritionSchema.optional(),
})

export const updateRecipeSchema = createRecipeSchema.partial()
