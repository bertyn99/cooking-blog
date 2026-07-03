/**
 * Pages query builder — deep parent population, draft protection, locale filtering.
 *
 * ALLOWED_RELATIONS:
 * - `content`  → direct column on pages (always returned; included for allowlist purposes)
 * - `seoMeta`  → one-to-one relation via seo.pageId (with nested socialMeta)
 * - `parent`   → self-referencing FK via pages.parentId (deep populate up to 3 levels)
 */
import { eq, and, isNull } from 'drizzle-orm'
import { pages } from '../../db/schema/pages'

// biome-ignore format: keep relations readable
export const PAGES_RELATIONS = ['content', 'seoMeta', 'parent'] as const

export type PageRelation = (typeof PAGES_RELATIONS)[number]

export interface PagesQueryOptions {
  /** Parsed include list from query params. '*' expands to all allowed relations. */
  include: string[]
  /** Locale to filter by. If omitted, no locale filter is applied. */
  locale?: string
  /** When false (unauthenticated), filters to published + non-deleted pages only. */
  isAuthenticated: boolean
}

// ---------------------------------------------------------------------------
// Where clause builder
// ---------------------------------------------------------------------------

/**
 * Builds a Drizzle WHERE clause for pages queries.
 *
 * Draft protection (unauthenticated):
 *   - status = 'published'
 *   - deleted_at IS NULL
 *
 * Authenticated users see all pages (including drafts and soft-deleted).
 */
export function buildPagesWhere(options: PagesQueryOptions) {
  const conditions = []

  // Draft protection: unauthenticated → published + not deleted
  if (!options.isAuthenticated) {
    conditions.push(eq(pages.status, 'published'))
    conditions.push(isNull(pages.deletedAt))
  }

  // Locale filtering
  if (options.locale) {
    conditions.push(eq(pages.locale, options.locale))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
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
export function buildPagesWith(include: string[]): Record<string, unknown> | undefined {
  const expanded = include.includes('*')
    ? [...PAGES_RELATIONS]
    : include.filter((r) => (PAGES_RELATIONS as readonly string[]).includes(r))

  const withObj: Record<string, unknown> = {}

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
