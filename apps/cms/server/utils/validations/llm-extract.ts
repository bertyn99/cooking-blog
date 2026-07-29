import { z } from 'zod'
import {
  ingredientSchema,
  nutritionSchema,
  recipeStepSchema,
} from './recipes'

export const llmEvidenceChunkSchema = z.object({
  text: z.string().min(1),
  sourceSpan: z.string().optional(),
})

export const llmArticleExtractSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  evidenceChunks: z.array(llmEvidenceChunkSchema).min(1),
})

export const llmRecipeExtractSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().max(500).nullable().optional(),
  intro: z.string().optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  cookTimeMinutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  steps: z.array(recipeStepSchema).optional(),
  nutrition: nutritionSchema.optional(),
  evidenceChunks: z.array(llmEvidenceChunkSchema).min(1),
})

export type LlmEvidenceChunk = z.infer<typeof llmEvidenceChunkSchema>
export type LlmArticleExtract = z.infer<typeof llmArticleExtractSchema>
export type LlmRecipeExtract = z.infer<typeof llmRecipeExtractSchema>
export type LlmExtract = LlmArticleExtract | LlmRecipeExtract

export function llmExtractSchemaForTarget(targetType: 'article' | 'recipe') {
  return targetType === 'article' ? llmArticleExtractSchema : llmRecipeExtractSchema
}
