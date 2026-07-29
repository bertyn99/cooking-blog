import type { StrapiEntityStats } from './types'

export type ImportRowOutcome = 'create' | 'update' | 'skip'

export function bumpImportStats(stats: StrapiEntityStats, outcome: ImportRowOutcome) {
  if (outcome === 'create') stats.created += 1
  else if (outcome === 'update') stats.updated += 1
  else stats.skipped += 1
}

export function dryRunOutcome(existingId: string | null, unchanged: boolean): ImportRowOutcome {
  if (!existingId) return 'create'
  if (unchanged) return 'skip'
  return 'update'
}

/** Compare selected fields; null and undefined are treated as equal. */
export function shallowFieldsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  for (const key of keys) {
    const av = a[key] ?? null
    const bv = b[key] ?? null
    if (av !== bv) return false
  }
  return true
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value)
}
