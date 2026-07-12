import { eq, and, isNull } from 'drizzle-orm'
import { recipes } from '../../db/schema/recipes'

export const RECIPES_RELATIONS = ['cover', 'category', 'nutrition', 'ingredients', 'reviews', 'seo'] as const
export type RecipeRelation = (typeof RECIPES_RELATIONS)[number]

export interface RecipesQueryOptions {
  include: string[]
  filters?: { slug?: string; categoryId?: number; locale?: string }
  isAuthenticated: boolean
}

export function buildRecipesWhere(opts: RecipesQueryOptions) {
  const conditions = []
  if (!opts.isAuthenticated) {
    conditions.push(eq(recipes.status, 'published'))
    conditions.push(isNull(recipes.deletedAt))
  }
  if (opts.filters?.slug) conditions.push(eq(recipes.slug, opts.filters.slug))
  if (opts.filters?.categoryId) conditions.push(eq(recipes.categoryId, opts.filters.categoryId))
  if (opts.filters?.locale) conditions.push(eq(recipes.locale, opts.filters.locale))
  return conditions.length > 0 ? and(...conditions) : undefined
}

export function buildRecipesWith(include: string[]): Record<string, unknown> | undefined {
  const expanded = include.includes('*') ? [...RECIPES_RELATIONS] : include.filter(r => (RECIPES_RELATIONS as readonly string[]).includes(r))
  const withObj: Record<string, unknown> = {}
  for (const r of expanded) {
    if (r === 'seo') withObj.seo = { with: { socialMeta: true } }
    else withObj[r] = true
  }
  return Object.keys(withObj).length > 0 ? withObj : undefined
}
