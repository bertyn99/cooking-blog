import type { RecipesQueryFilter, RecipesWith } from '../../../query-types'

export const RECIPES_RELATIONS = ['cover', 'category', 'nutrition', 'ingredients', 'utensils', 'steps', 'reviews', 'seo'] as const
export type RecipeRelation = (typeof RECIPES_RELATIONS)[number]

export interface RecipesQueryOptions {
  include: string[]
  filters?: {
    slug?: string
    categoryId?: number
    categoryIds?: number[]
    locale?: string
    search?: string
    status?: 'draft' | 'published' | 'scheduled'
  }
  isAuthenticated: boolean
}

export function buildRecipesQueryWhere(opts: RecipesQueryOptions): RecipesQueryFilter | undefined {
  const filters: NonNullable<RecipesQueryFilter>[] = []

  if (!opts.isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }
  if (opts.filters?.slug) filters.push({ slug: opts.filters.slug })
  if (opts.filters?.categoryId) filters.push({ categoryId: opts.filters.categoryId })
  if (opts.filters?.locale) filters.push({ locale: opts.filters.locale })
  if (opts.filters?.status) filters.push({ status: opts.filters.status })
  if (opts.filters?.search) {
    const term = `%${opts.filters.search}%`
    filters.push({
      OR: [{ title: { like: term } }, { slug: { like: term } }],
    })
  }

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
      case 'steps':
        withObj.steps = true
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
