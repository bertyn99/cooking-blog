import { validateBody } from '../../utils/validate'
import { updateRecipeSchema } from '../../utils/validations/recipes'
import { useQueries, useDb } from '../../utils/db'
import type { RecipeUpdatePatch } from '../../db/queries/recipes'
import { requireEditor } from '../../utils/http-auth'
import { applyContentStatusPolicy } from '../../utils/content-status-policy'
import { authorshipOnUpdate } from '../../utils/content-authorship'
import { createApiError, fromQueryError } from '../../utils/errors'
import {
  assertHumanReviewAllowsPublish,
  hasRecipeEditorialChanges,
  nextVersionAfterHumanReviewEdit,
} from '../../utils/human-review-publish'

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

  const { ingredients, nutrition, utensils, steps, ...recipeFields } = data

  const statusFields = applyContentStatusPolicy(session.user, existing, {
    status: recipeFields.status,
    scheduledAt: recipeFields.scheduledAt,
  })

  const updates: RecipeUpdatePatch = {
    ...recipeFields,
    ...authorshipOnUpdate(session.user.id),
    ...(recipeFields.status !== undefined
      ? {
          status: statusFields.status ?? recipeFields.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
          firstPublishedAt: statusFields.firstPublishedAt,
        }
      : {}),
  }

  const editorialChanged = hasRecipeEditorialChanges(
    existing as Record<string, unknown>,
    updates as Record<string, unknown>,
  )
  const relationsChanged = ingredients !== undefined
    || utensils !== undefined
    || steps !== undefined
    || nutrition !== undefined
  const versionBump = nextVersionAfterHumanReviewEdit(
    existing,
    editorialChanged || relationsChanged,
  )
  if (versionBump !== undefined) {
    updates.version = versionBump
  }

  const nextStatus = updates.status ?? existing.status
  if (nextStatus === 'published' && existing.status !== 'published') {
    const versionForGate = updates.version ?? existing.version ?? 1
    try {
      await assertHumanReviewAllowsPublish(
        useDb(event),
        'recipe',
        id,
        versionForGate,
        Boolean(existing.requiresHumanReview),
      )
    }
    catch (error) {
      fromQueryError(error)
    }
  }

  const result = await recipes.updateWithRelations(id, updates, {
    ingredients: ingredients !== undefined ? (ingredients ?? []) : undefined,
    utensils: utensils !== undefined ? (utensils ?? []) : undefined,
    steps: steps !== undefined ? (steps ?? []) : undefined,
    nutrition: nutrition !== undefined ? (nutrition ?? null) : undefined,
  })

  return result
})
