import { validateBody } from '../../utils/validate'
import { updateRecipeSchema } from '../../utils/validations/recipes'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'
import type { RecipeUpdatePatch } from '../../db/queries/recipes'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const { recipes } = useQueries(event)
  const existing = await recipes.findRowById(id)
  if (!existing) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const data = validateBody(updateRecipeSchema, body)

  const { ingredients, nutrition, utensils, ...recipeFields } = data
  const updates: RecipeUpdatePatch = { ...recipeFields }

  if (data.status === 'published') {
    updates.publishedAt = new Date().toISOString()
    if (!existing.firstPublishedAt) updates.firstPublishedAt = new Date().toISOString()
  }

  const result = await recipes.updateWithRelations(id, updates, {
    ingredients: ingredients !== undefined ? (ingredients ?? []) : undefined,
    utensils: utensils !== undefined ? (utensils ?? []) : undefined,
    nutrition: nutrition !== undefined ? (nutrition ?? null) : undefined,
  })

  return result
})
