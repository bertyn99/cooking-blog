/**
 * Pages query builder — deep parent population, draft protection, locale filtering.
 */
import type { PagesQueryFilter, PagesWith } from '../../../query-types'

// biome-ignore format: keep relations readable
export const PAGES_RELATIONS = ['content', 'seoMeta', 'parent'] as const

export type PageRelation = (typeof PAGES_RELATIONS)[number]

export interface PagesQueryOptions {
  /** Parsed include list from query params. '*' expands to all allowed relations. */
  include: string[]
  /** Locale to filter by. If omitted, no locale filter is applied. */
  locale?: string
  filters?: {
    slug?: string
    parentSlug?: string
    parentId?: number
  }
  /** When false (unauthenticated), filters to published + non-deleted pages only. */
  isAuthenticated: boolean
  includeDeleted?: boolean
}

// ---------------------------------------------------------------------------
// Where clause builder
// ---------------------------------------------------------------------------

/**
 * Builds a Drizzle relational WHERE for pages queries.
 */
export function buildPagesQueryWhere(options: PagesQueryOptions): PagesQueryFilter | undefined {
  const filters: NonNullable<PagesQueryFilter>[] = []

  if (!options.isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }
  else if (!options.includeDeleted) {
    filters.push({ deletedAt: { isNull: true } })
  }

  if (options.locale) {
    filters.push({ locale: options.locale })
  }

  if (filters.length === 0) return undefined
  if (filters.length === 1) return filters[0]
  return { AND: filters }
}

export function buildPageDetailQueryWhere(id: number, isAuthenticated: boolean): PagesQueryFilter | undefined {
  const filters: NonNullable<PagesQueryFilter>[] = [{ id }]

  if (!isAuthenticated) {
    filters.push({ status: 'published' }, { deletedAt: { isNull: true } })
  }

  if (filters.length === 1) return filters[0]
  return { AND: filters }
}

// ---------------------------------------------------------------------------
// With (relation population) builder
// ---------------------------------------------------------------------------

/**
 * Builds a Drizzle `with` object for relation population.
 *
 * - `content` is a direct column, not a relation — skipped in the `with` object.
 * - `seoMeta` populates the seo row linked via seo.pageId, with nested socialMeta.
 * - `parent` deep-populates up to 3 levels of the self-referencing hierarchy.
 *
 * When `*` wildcard is present, ALL allowed relations are populated.
 */
export function buildPagesWith(include: string[]): PagesWith | undefined {
  const expanded = include.includes('*')
    ? [...PAGES_RELATIONS]
    : include.filter((r) => (PAGES_RELATIONS as readonly string[]).includes(r))

  const withObj: PagesWith = {}

  // seoMeta: SEO metadata linked via seo.pageId, with nested socialMeta
  if (expanded.includes('seoMeta')) {
    withObj.seoMeta = { with: { socialMeta: true } }
  }

  // parent: self-referencing FK — deep populate up to 3 ancestor levels
  if (expanded.includes('parent')) {
    withObj.parent = {
      with: {
        parent: {
          with: {
            parent: true,
          },
        },
      },
    }
  }

  return Object.keys(withObj).length > 0 ? withObj : undefined
}
