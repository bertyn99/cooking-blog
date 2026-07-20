export const STRAPI_IMPORT_STEPS = [
  'category-articles',
  'categories',
  'articles',
  'recipes',
  'pages',
] as const

export type StrapiImportStep = typeof STRAPI_IMPORT_STEPS[number]

/** FK order — importers auto-include missing prerequisites. */
export const STRAPI_IMPORT_STEP_DEPS: Record<StrapiImportStep, readonly StrapiImportStep[]> = {
  'category-articles': [],
  'categories': [],
  'articles': ['category-articles'],
  'recipes': ['categories'],
  'pages': [],
}

export function resolveImportSteps(requested: readonly StrapiImportStep[]): StrapiImportStep[] {
  const needed = new Set<StrapiImportStep>()
  for (const step of requested) {
    for (const dep of STRAPI_IMPORT_STEP_DEPS[step]) {
      needed.add(dep)
    }
    needed.add(step)
  }
  return STRAPI_IMPORT_STEPS.filter(step => needed.has(step))
}

export interface StrapiEntityStats {
  created: number
  updated: number
  /** Unchanged rows or skipped media (already present). */
  skipped: number
  errors: number
}

export type StrapiStepSyncState = 'empty' | 'partial' | 'synced' | 'unknown'

export interface StrapiStepCoverage {
  step: StrapiImportStep
  /** Rows linked in legacy_strapi_map for this step. */
  mappedCount: number
  /** Strapi collection total when reachable. */
  strapiTotal: number | null
  state: StrapiStepSyncState
}

export function formatStepCoverageHint(coverage: StrapiStepCoverage): string {
  const { mappedCount, strapiTotal, state } = coverage
  if (state === 'synced' && strapiTotal != null) {
    return `${mappedCount}/${strapiTotal} déjà importé — relancer ne fera qu’une vérif.`
  }
  if (state === 'partial' && strapiTotal != null) {
    return `${mappedCount}/${strapiTotal} importé(s) — import partiel possible.`
  }
  if (mappedCount > 0 && strapiTotal == null) {
    return `${mappedCount} entrée(s) en base (total Strapi inconnu).`
  }
  return 'Rien en base pour cette étape.'
}

export function formatStepStatsMessage(step: string, stats: StrapiEntityStats): string {
  const { created, updated, skipped, errors } = stats
  if (errors > 0) {
    return `${step} — créés ${created}, mis à jour ${updated}, inchangés ${skipped}, erreurs ${errors}`
  }
  if (created === 0 && updated === 0 && skipped > 0) {
    return `${step} — déjà synchronisé (${skipped} entrée(s) inchangée(s))`
  }
  if (created === 0 && updated === 0 && skipped === 0) {
    return `${step} — aucune entrée côté Strapi`
  }
  return `${step} — créés ${created}, mis à jour ${updated}, inchangés ${skipped}`
}

export interface StrapiImportResult {
  dryRun: boolean
  finishedAt: string
  steps: Partial<Record<StrapiImportStep, StrapiEntityStats>>
  media: StrapiEntityStats
  messages: string[]
}

export function isImportResultFullyUnchanged(result: StrapiImportResult): boolean {
  const stepStats = Object.values(result.steps)
  if (!stepStats.length) return false
  return stepStats.every(
    s => s && s.created === 0 && s.updated === 0 && s.errors === 0 && s.skipped > 0,
  )
}

export interface StrapiImportProgress {
  status: 'idle' | 'running' | 'completed' | 'failed'
  dryRun: boolean
  currentStep?: StrapiImportStep
  startedAt?: string
  finishedAt?: string
  messages: string[]
  result?: StrapiImportResult
  error?: string
}

export interface StrapiImportLock {
  id: string
  acquiredAt: string
}

export interface StrapiReachabilityCache {
  reachable: boolean
  totalArticles?: number
  checkedAt: string
}

export interface StrapiImportRunBody {
  dryRun?: boolean
  steps?: StrapiImportStep[]
}

export interface StrapiImportConfigResponse {
  strapiUrl: string
  hasStrapiToken: boolean
  strapiReachable: boolean | null
  strapiArticleCount?: number
  reachabilityCheckedAt?: string
  stepCoverage?: Record<StrapiImportStep, StrapiStepCoverage>
  status: StrapiImportProgress
}
