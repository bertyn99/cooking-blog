import { validateBody } from '../../utils/validate'
import { updateRecipeSchema } from '../../utils/validations/recipes'
import { useQueries } from '../../utils/db'
import type { RecipeUpdatePatch } from '../../db/queries/recipes'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'
import { authorshipOnUpdate } from '../../utils/content-authorship'
import { createApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Recette introuvable.')
  }

  const { recipes } = useQueries(event)
  const existing = await recipes.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Recette introuvable.')
  }

  const body = await readBody(event)
  const data = validateBody(updateRecipeSchema, body)

  const { ingredients, nutrition, utensils, ...recipeFields } = data
  const updates: RecipeUpdatePatch = { ...recipeFields, ...authorshipOnUpdate(session.user.id) }
  applyContentStatusPolicy(session.user, existing, updates)

  const result = await recipes.updateWithRelations(id, updates, {
    ingredients: ingredients !== undefined ? (ingredients ?? []) : undefined,
    utensils: utensils !== undefined ? (utensils ?? []) : undefined,
    nutrition: nutrition !== undefined ? (nutrition ?? null) : undefined,
  })

  return result
})
