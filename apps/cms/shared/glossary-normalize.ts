import { slugifyString } from './slug'

export type GlossaryKind = 'ingredient' | 'technique' | 'ustensile'

export const GLOSSARY_KINDS = ['ingredient', 'technique', 'ustensile'] as const satisfies readonly GlossaryKind[]

export const GLOSSARY_KIND_LABELS_FR: Record<GlossaryKind, string> = {
  ingredient: 'Ingrédient',
  technique: 'Technique',
  ustensile: 'Ustensile',
}

export function isGlossaryKind(value: unknown): value is GlossaryKind {
  return value === 'ingredient' || value === 'technique' || value === 'ustensile'
}

export function unaccentLower(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
}

export function glossarySortKey(value: string): string {
  return unaccentLower(value).trim().replace(/\s+/g, ' ')
}

const TRAILING_PARENS = /\s*\(([^()]*)\)\s*$/

export interface ParsedIngredientName {
  name: string
  note: string | null
  sortKey: string
}

/**
 * Exact-name identity after trim / lower / unaccent.
 * Trailing `(…)` is stripped into `note` and is not part of the term name.
 */
export function parseIngredientDisplayName(raw: string): ParsedIngredientName {
  const trimmed = raw.trim()
  const match = trimmed.match(TRAILING_PARENS)
  const name = (match ? trimmed.slice(0, match.index).trim() : trimmed)
  const note = match?.[1]?.trim() || null
  return {
    name,
    note,
    sortKey: glossarySortKey(name),
  }
}

export function glossaryTermSlugFromName(name: string): string {
  return slugifyString(name) || 'terme'
}

export interface DedupedIngredientSource {
  originalName: string
  recipeId?: number
  qty?: number | null
  unit?: string | null
  sortOrder?: number | null
}

export interface DedupedIngredientGroup {
  sortKey: string
  name: string
  slug: string
  sources: DedupedIngredientSource[]
}

/**
 * Groups ingredient lines by exact normalized name. Does not merge
 * "farine" with "farine de ble".
 */
export function dedupeIngredientNames(rows: DedupedIngredientSource[]): DedupedIngredientGroup[] {
  const groups = new Map<string, DedupedIngredientGroup>()

  for (const row of rows) {
    const parsed = parseIngredientDisplayName(row.originalName)
    if (!parsed.name || !parsed.sortKey) continue

    const existing = groups.get(parsed.sortKey)
    if (existing) {
      existing.sources.push(row)
      continue
    }

    groups.set(parsed.sortKey, {
      sortKey: parsed.sortKey,
      name: parsed.name,
      slug: glossaryTermSlugFromName(parsed.name),
      sources: [row],
    })
  }

  return [...groups.values()]
}

export function uniqueSlugs(groups: Array<{ slug: string, sortKey: string }>): Map<string, string> {
  const used = new Set<string>()
  const bySortKey = new Map<string, string>()

  for (const group of groups) {
    let slug = group.slug
    let counter = 2
    while (used.has(slug)) {
      slug = `${group.slug}-${counter}`
      counter += 1
    }
    used.add(slug)
    bySortKey.set(group.sortKey, slug)
  }

  return bySortKey
}
