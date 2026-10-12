import type { H3Event } from 'h3'
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
import { findOrCreateGlossaryStub } from './glossary-mutations'
import { parseIngredientDisplayName, type GlossaryKind } from '../../shared/glossary-normalize'
import { glossaryLineTermError } from '../../shared/glossary-lines'

type CreateRecipeInput = z.infer<typeof createRecipeSchema>
type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>
type IngredientInput = NonNullable<CreateRecipeInput['ingredients']>[number]
type UtensilInput = NonNullable<CreateRecipeInput['utensils']>[number]

async function requireGlossaryLineTerm(
  event: H3Event,
  glossaryTermId: number,
  expected: GlossaryKind,
) {
  const { glossary } = useQueries(event)
  const term = await glossary.findRowById(glossaryTermId)
  const message = glossaryLineTermError(term, expected)
  if (message) {
    throw createApiError('VALIDATION_ERROR', message)
  }
}

async function resolveIngredientLines(
  event: H3Event,
  actor: Actor,
  lines: IngredientInput[] | undefined,
  locale: string,
  meta?: MutationMeta,
) {
  if (!lines) return undefined
  const resolved: Array<{
    glossaryTermId: number
    qty?: number
    unit?: string
    note?: string | null
    sortOrder?: number
  }> = []

  for (const [index, line] of lines.entries()) {
    if ('glossaryTermId' in line) {
      await requireGlossaryLineTerm(event, line.glossaryTermId, 'ingredient')
      const parsedNote = line.note?.trim() || null
      resolved.push({
        glossaryTermId: line.glossaryTermId,
        qty: line.qty,
        unit: line.unit,
        note: parsedNote,
        sortOrder: line.sortOrder ?? index,
      })
      continue
    }

    const parsed = parseIngredientDisplayName(line.name)
    const term = await findOrCreateGlossaryStub(event, actor, {
      kind: 'ingredient',
      name: parsed.name,
      locale,
    }, meta)
    resolved.push({
      glossaryTermId: term.id,
      qty: line.qty,
      unit: line.unit,
      note: line.note?.trim() || parsed.note,
      sortOrder: line.sortOrder ?? index,
    })
  }

  return resolved
}

async function resolveUtensilLines(
  event: H3Event,
  actor: Actor,
  lines: UtensilInput[] | undefined,
  locale: string,
  meta?: MutationMeta,
) {
  if (!lines) return undefined
  const resolved: Array<{
    glossaryTermId: number
    note?: string | null
    sortOrder?: number
  }> = []

  for (const [index, line] of lines.entries()) {
    if ('glossaryTermId' in line) {
      await requireGlossaryLineTerm(event, line.glossaryTermId, 'ustensile')
      resolved.push({
        glossaryTermId: line.glossaryTermId,
        note: line.note?.trim() || null,
        sortOrder: line.sortOrder ?? index,
      })
      continue
    }

    const term = await findOrCreateGlossaryStub(event, actor, {
      kind: 'ustensile',
      name: line.name,
      locale,
      iconKey: 'iconKey' in line ? line.iconKey : null,
    }, meta)
    resolved.push({
      glossaryTermId: term.id,
      note: line.note?.trim() || null,
      sortOrder: line.sortOrder ?? index,
    })
  }

  return resolved
}

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

  const ingredientRows = await resolveIngredientLines(
    event,
    actor,
    data.ingredients,
    data.locale || 'fr',
    meta,
  )
  if (ingredientRows?.length) {
    await recipes.replaceIngredients(result.id, ingredientRows)
  }
  const utensilRows = await resolveUtensilLines(
    event,
    actor,
    data.utensils,
    data.locale || 'fr',
    meta,
  )
  if (utensilRows?.length) {
    await recipes.replaceUtensils(result.id, utensilRows)
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
  }, { apiKeyMode: 'in-place' })

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

  const locale = data.locale || existing.locale || 'fr'
  const resolvedIngredients = ingredients !== undefined
    ? await resolveIngredientLines(event, actor, ingredients ?? [], locale, meta)
    : undefined
  const resolvedUtensils = utensils !== undefined
    ? await resolveUtensilLines(event, actor, utensils ?? [], locale, meta)
    : undefined

  const result = await recipes.updateWithRelations(id, updates, {
    ingredients: resolvedIngredients,
    utensils: resolvedUtensils,
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
