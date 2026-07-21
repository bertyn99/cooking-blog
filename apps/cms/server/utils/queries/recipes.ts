import { eq, and, isNull } from 'drizzle-orm'
import { recipes } from '../../db/schema/recipes'
import type { RecipesQueryFilter, RecipesWith } from '../../db/query-types'

export const RECIPES_RELATIONS = ['cover', 'category', 'nutrition', 'ingredients', 'utensils', 'reviews', 'seo'] as const
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

export function buildRecipesQueryWhere(opts: RecipesQueryOptions): RecipesQueryFilter | undefined {
  const filters: NonNullable<RecipesQueryFilter>[] = []

  if (!opts.isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }
  if (opts.filters?.slug) filters.push({ slug: opts.filters.slug })
  if (opts.filters?.categoryId) filters.push({ categoryId: opts.filters.categoryId })
  if (opts.filters?.locale) filters.push({ locale: opts.filters.locale })

  if (filters.length === 0) return undefined
  if (filters.length === 1) return filters[0]
  return { AND: filters }
}


export function buildRecipesWith(include: string[]): RecipesWith | undefined {
  const expanded = include.includes('*') ? [...RECIPES_RELATIONS] : include.filter(r => (RECIPES_RELATIONS as readonly string[]).includes(r))
  if (expanded.length === 0) return undefined

  const withObj: RecipesWith = {}
  for (const relation of expanded) {
    switch (relation) {
      case 'cover':
        withObj.cover = true
        break
      case 'category':
        withObj.category = true
        break
      case 'nutrition':
        withObj.nutrition = true
        break
      case 'ingredients':
        withObj.ingredients = true
        break
      case 'utensils':
        withObj.utensils = true
        break
      case 'reviews':
        withObj.reviews = true
        break
      case 'seo':
        withObj.seo = { with: { socialMeta: true } }
        break
    }
  }
  return withObj
}

export function buildRecipeDetailQueryWhere(id: number, isAuthenticated: boolean): RecipesQueryFilter | undefined {
  const filters: NonNullable<RecipesQueryFilter>[] = [{ id }]

  if (!isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }

  if (filters.length === 1) return filters[0]
  return { AND: filters }
}
