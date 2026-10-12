import { z } from 'zod'
import { GLOSSARY_ICON_KEYS } from '../../../shared/glossary-icons'

const ingredientUnitSchema = z.enum(['none', 'g', 'mg', 'kg', 'l', 'ml', 'cuillere_soupe', 'cuillere_cafe', 'tasse'])

export const ingredientSchema = z.union([
  z.object({
    glossaryTermId: z.number().int().positive(),
    qty: z.number().optional(),
    unit: ingredientUnitSchema.optional(),
    note: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
  z.object({
    name: z.string().min(1),
    qty: z.number().optional(),
    unit: ingredientUnitSchema.optional(),
    note: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
])

export const recipeUtensilSchema = z.union([
  z.object({
    glossaryTermId: z.number().int().positive(),
    note: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
  z.object({
    name: z.string().min(1),
    note: z.string().optional(),
    iconKey: z.enum(GLOSSARY_ICON_KEYS).optional(),
    sortOrder: z.number().optional(),
  }),
])

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
