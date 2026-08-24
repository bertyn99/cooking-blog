import type { H3Event } from 'nitro/h3'
import type { z } from 'zod'
import { createRecipeSchema, updateRecipeSchema } from '../utils/validations/recipes'
import type { RecipeUpdatePatch } from '../db/queries/recipes'
import { slugifyString } from '../utils/slug'
import { useDb, useQueries } from '../utils/db'
import { createApiError, fromQueryError } from '../utils/errors'
import { authorshipOnCreate, authorshipOnUpdate } from '../utils/content-authorship'
import { applyContentPolicy } from '../utils/content-status-policy'
import type { Actor } from '../utils/actor'
import { actorApiKeyId, actorUserId } from '../utils/actor'
import { recordContentAudit } from './content-audit'
import type { MutationMeta } from './article-mutations'
import {
  assertHumanReviewAllowsPublish,
  hasRecipeEditorialChanges,
  nextVersionAfterHumanReviewEdit,
} from '../utils/human-review-publish'

type CreateRecipeInput = z.infer<typeof createRecipeSchema>
type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>

export async function createRecipeMutation(
  event: H3Event,
  actor: Actor,
  data: CreateRecipeInput,
  meta?: MutationMeta,
) {
  const { recipes } = useQueries(event)
  const statusPatch = applyContentPolicy(actor, null, { status: data.status })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await recipes.reserveUniqueSlug(baseSlug, data.locale || 'fr')
  const now = new Date().toISOString()
  const userId = actorUserId(actor)

  const result = await recipes.insert({
    title: data.title,
    intro: data.intro,
    excerpt: data.excerpt,
    featured: data.featured,
    slug,
    categoryId: data.categoryId,
    step: data.step,
    difficulty: data.difficulty,
    time: data.time,
    prepTimeMinutes: data.prepTimeMinutes,
    cookTimeMinutes: data.cookTimeMinutes,
    servings: data.servings,
    coverBlobPathname: data.coverBlobPathname,
    coverAltText: data.coverAltText,
    coverDescription: data.coverDescription,
    locale: data.locale || 'fr',
    localeGroupId: data.localeGroupId,
    status,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? statusPatch.scheduledAt ?? null : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(userId),
  })

  if (data.ingredients?.length) {
    await recipes.replaceIngredients(result.id, data.ingredients)
  }
  if (data.utensils?.length) {
    await recipes.replaceUtensils(result.id, data.utensils)
  }
  if (data.steps?.length) {
    await recipes.replaceSteps(result.id, data.steps)
  }
  if (data.nutrition) {
    await recipes.replaceNutrition(result.id, data.nutrition)
  }

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.create',
    entityType: 'recipe',
    entityId: result.id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return result
}

export async function updateRecipeMutation(
  event: H3Event,
  actor: Actor,
  id: number,
  data: UpdateRecipeInput,
  meta?: MutationMeta,
) {
  const { recipes } = useQueries(event)
  const existing = await recipes.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Recette introuvable.')
  }

  const { ingredients, nutrition, utensils, steps, ...recipeFields } = data

  const statusFields = applyContentPolicy(actor, existing, {
    status: recipeFields.status,
    scheduledAt: recipeFields.scheduledAt,
  })

  const userId = actorUserId(actor)
  const updates: RecipeUpdatePatch = {
    ...recipeFields,
    ...authorshipOnUpdate(userId),
    ...(recipeFields.status !== undefined
      ? {
          status: statusFields.status ?? recipeFields.status,
          publishedAt: statusFields.publishedAt,
          scheduledAt: statusFields.scheduledAt,
          firstPublishedAt: statusFields.firstPublishedAt,
        }
      : {}),
  }

  if (actor.kind === 'session') {
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
  }

  const result = await recipes.updateWithRelations(id, updates, {
    ingredients: ingredients !== undefined ? (ingredients ?? []) : undefined,
    utensils: utensils !== undefined ? (utensils ?? []) : undefined,
    steps: steps !== undefined ? (steps ?? []) : undefined,
    nutrition: nutrition !== undefined ? (nutrition ?? null) : undefined,
  })

  await recordContentAudit(useDb(event), {
    actorUserId: userId,
    actorApiKeyId: actorApiKeyId(actor),
    action: 'content.update',
    entityType: 'recipe',
    entityId: id,
    metadata: meta?.tool ? { tool: meta.tool } : null,
  })

  return result
}

export { createRecipeSchema, updateRecipeSchema }
