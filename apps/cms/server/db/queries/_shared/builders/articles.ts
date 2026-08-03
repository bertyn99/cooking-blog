import type { ArticlesQueryFilter, ArticlesWith } from '../../../query-types'

export const ARTICLES_RELATIONS = ['cover', 'category', 'seo'] as const
export type ArticleRelation = (typeof ARTICLES_RELATIONS)[number]

export interface ArticlesQueryOptions {
  include: string[]
  filters?: {
    slug?: string
    categoryId?: number
    categoryIds?: number[]
    locale?: string
    status?: 'draft' | 'published' | 'scheduled'
    search?: string
  }
  isAuthenticated: boolean
  includeDeleted?: boolean
}

export function buildArticlesQueryWhere(opts: ArticlesQueryOptions): ArticlesQueryFilter | undefined {
  const filters: NonNullable<ArticlesQueryFilter>[] = []

  if (!opts.isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }
  else if (!opts.includeDeleted) {
    filters.push({ deletedAt: { isNull: true } })
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


export function buildArticlesWith(include: string[]): ArticlesWith | undefined {
  const expanded = include.includes('*') ? [...ARTICLES_RELATIONS] : include.filter(r => (ARTICLES_RELATIONS as readonly string[]).includes(r))
  if (expanded.length === 0) return undefined

  const withObj: ArticlesWith = {}
  for (const relation of expanded) {
    switch (relation) {
      case 'cover':
        withObj.cover = true
        break
      case 'category':
        withObj.category = true
        break
      case 'seo':
        withObj.seo = true
        break
    }
  }
  return withObj
}
