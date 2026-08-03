import type { AppDb } from '../db/create-db'
import { createContentGenerationQueries } from '../db/queries/content-generation'
import { queryConflict } from '../db/query-errors'

export type HumanReviewContentKind = 'article' | 'recipe'

const ARTICLE_EDITORIAL_KEYS = [
  'title',
  'content',
  'excerpt',
  'slug',
  'categoryId',
  'coverBlobPathname',
  'coverAltText',
  'coverDescription',
  'locale',
  'localeGroupId',
] as const

const RECIPE_EDITORIAL_KEYS = [
  'title',
  'intro',
  'excerpt',
  'slug',
  'categoryId',
  'step',
  'difficulty',
  'time',
  'prepTimeMinutes',
  'cookTimeMinutes',
  'servings',
  'coverBlobPathname',
  'coverAltText',
  'coverDescription',
  'locale',
  'localeGroupId',
] as const

function hasEditorialChanges(
  existing: Record<string, unknown>,
  updates: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => {
    if (!(key in updates)) {
      return false
    }
    return updates[key] !== existing[key]
  })
}

export function hasArticleEditorialChanges(
  existing: Record<string, unknown>,
  updates: Record<string, unknown>,
): boolean {
  return hasEditorialChanges(existing, updates, ARTICLE_EDITORIAL_KEYS)
}

export function hasRecipeEditorialChanges(
  existing: Record<string, unknown>,
  updates: Record<string, unknown>,
): boolean {
  return hasEditorialChanges(existing, updates, RECIPE_EDITORIAL_KEYS)
}

export function nextVersionAfterHumanReviewEdit(
  existing: { requiresHumanReview?: boolean | null, version?: number | null },
  editorialChanged: boolean,
): number | undefined {
  if (!existing.requiresHumanReview || !editorialChanged) {
    return undefined
  }
  return (existing.version ?? 1) + 1
}

export async function assertHumanReviewAllowsPublish(
  db: AppDb,
  kind: HumanReviewContentKind,
  contentId: number,
  currentVersion: number,
  requiresHumanReview: boolean,
) {
  if (!requiresHumanReview) {
    return
  }

  const generation = createContentGenerationQueries(db)
  const approved = await generation.findApprovedVersionMatch({
    targetType: kind,
    articleId: kind === 'article' ? contentId : null,
    recipeId: kind === 'recipe' ? contentId : null,
    version: currentVersion,
  })

  if (!approved) {
    throw queryConflict(
      'Publication bloquée : approbation humaine requise pour cette version du contenu.',
    )
  }
}
