import type { CmsListResponse } from '~/types/cms'

/** Shared ofetch defaults for the public CMS hop (Nuxt `$fetch` is ofetch). */
export const CMS_FETCH_DEFAULTS = {
  timeout: 10_000,
  retry: 1,
  retryDelay: 250,
  retryStatusCodes: [408, 429, 502, 503, 504],
} as const

export type CmsInclude = string | readonly string[]

export interface CmsPageListQuery {
  slug?: string
  parentSlug?: string
  isHome?: boolean
  locale?: string
  include?: CmsInclude
  page?: number
  pageSize?: number
}

export interface CmsEntryListQuery {
  slug?: string
  slugs?: readonly string[]
  categorySlug?: string
  categoryId?: number
  categoryNames?: readonly string[]
  search?: string
  locale?: string
  include?: CmsInclude
  page?: number
  pageSize?: number
}

export type CmsRecipeListQuery = CmsEntryListQuery
export type CmsArticleListQuery = CmsEntryListQuery

export interface CmsCategoryListQuery {
  include?: CmsInclude
  page?: number
  pageSize?: number
}

export type CmsQuery =
  | CmsPageListQuery
  | CmsEntryListQuery
  | CmsCategoryListQuery
  | Record<string, string | number | boolean | readonly string[] | undefined>

/**
 * Flatten typed CMS query objects into ofetch `query`.
 * Arrays become comma lists (`slugs=a,b`) to match the CMS parsers — ofetch
 * would otherwise repeat keys (`slugs=a&slugs=b`).
 */
export function toCmsQuery(
  query: CmsQuery | undefined,
): Record<string, string | number> {
  if (!query) return {}

  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      out[key] = value.join(',')
    }
    else if (typeof value === 'boolean') {
      out[key] = value ? 'true' : 'false'
    }
    else if (typeof value === 'number' || typeof value === 'string') {
      out[key] = value
    }
  }
  return out
}

export function cmsCollectionPath(collection: string): string {
  return `/${collection.replace(/^\/+/, '')}`
}

export type { CmsListResponse }
