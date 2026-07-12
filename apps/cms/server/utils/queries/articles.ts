import { eq, and, isNull } from 'drizzle-orm'
import { articles } from '../../db/schema/articles'

export const ARTICLES_RELATIONS = ['cover', 'category', 'seo'] as const
export type ArticleRelation = (typeof ARTICLES_RELATIONS)[number]

export interface ArticlesQueryOptions {
  include: string[]
  filters?: { slug?: string; categoryId?: number; locale?: string }
  isAuthenticated: boolean
}

export function buildArticlesWhere(opts: ArticlesQueryOptions) {
  const conditions = []
  if (!opts.isAuthenticated) {
    conditions.push(eq(articles.status, 'published'))
    conditions.push(isNull(articles.deletedAt))
  }
  if (opts.filters?.slug) conditions.push(eq(articles.slug, opts.filters.slug))
  if (opts.filters?.categoryId) conditions.push(eq(articles.categoryId, opts.filters.categoryId))
  if (opts.filters?.locale) conditions.push(eq(articles.locale, opts.filters.locale))
  return conditions.length > 0 ? and(...conditions) : undefined
}

export function buildArticlesWith(include: string[]): Record<string, unknown> | undefined {
  const expanded = include.includes('*') ? [...ARTICLES_RELATIONS] : include.filter(r => (ARTICLES_RELATIONS as readonly string[]).includes(r))
  const withObj: Record<string, unknown> = {}
  if (expanded.length > 0) for (const r of expanded) withObj[r] = true
  return Object.keys(withObj).length > 0 ? withObj : undefined
}
