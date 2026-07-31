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

export function resolveImportSteps(
  requested: readonly StrapiImportStep[],
  options?: { omitDependencies?: boolean },
): StrapiImportStep[] {
  if (options?.omitDependencies) {
    return STRAPI_IMPORT_STEPS.filter(step => (requested as readonly string[]).includes(step))
  }
  const needed = new Set<StrapiImportStep>()
  for (const step of requested) {
    for (const dep of STRAPI_IMPORT_STEP_DEPS[step]) {
      needed.add(dep)
    }
    needed.add(step)
  }
  return STRAPI_IMPORT_STEPS.filter(step => needed.has(step))
}

export const STRAPI_IMPORT_TEST_TARGETS = ['article', 'recipe', 'page'] as const
export type StrapiImportTestTarget = typeof STRAPI_IMPORT_TEST_TARGETS[number]

export const STRAPI_IMPORT_TEST_TARGET_STEP: Record<StrapiImportTestTarget, StrapiImportStep> = {
  article: 'articles',
  recipe: 'recipes',
  page: 'pages',
}

export interface StrapiImportSlugFilter {
  slug: string
  locale?: string
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

export interface StrapiImportAccumulatedStats {
  steps: Partial<Record<StrapiImportStep, StrapiEntityStats>>
  media: StrapiEntityStats
}

export interface StrapiImportResult {
  dryRun: boolean
  finishedAt: string
  steps: Partial<Record<StrapiImportStep, StrapiEntityStats>>
  media: StrapiEntityStats
  messages: string[]
  /** Present when more Worker invocations are required (media downloads). */
  continuation?: StrapiImportContinuation
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

/** Content items processed per HTTP request (Cloudflare Workers ~50 subrequest limit). */
export const STRAPI_IMPORT_CONTENT_BATCH_SIZE = 1

export const STRAPI_IMPORT_BATCHED_STEPS = ['articles', 'recipes', 'pages'] as const
export type StrapiImportBatchedStep = typeof STRAPI_IMPORT_BATCHED_STEPS[number]

export function isStrapiImportBatchedStep(step: StrapiImportStep): step is StrapiImportBatchedStep {
  return (STRAPI_IMPORT_BATCHED_STEPS as readonly string[]).includes(step)
}

/**
 * Lightweight resume token. Slug lists live in KV (`strapi-import:slugs:{lockId}:{step}`)
 * so continuation bodies stay small across many Worker invocations.
 */
export interface StrapiImportContinuation {
  lockId: string
  dryRun: boolean
  /** Full ordered step list for this run. */
  steps: StrapiImportStep[]
  /** Index into `steps` for the unit of work to run next. */
  stepIndex: number
  /**
   * When set, resume mid-step content import.
   * `reconcile: true` runs page parent linking after all page items are imported.
   * When omitted, the next request starts (or lists slugs for) `steps[stepIndex]`.
   */
  batch?: {
    step: StrapiImportBatchedStep
    nextIndex: number
    reconcile?: boolean
  }
  /** Running totals across prior requests in this import. */
  accumulated: StrapiImportAccumulatedStats
}

export interface StrapiImportRunBody {
  dryRun?: boolean
  steps?: StrapiImportStep[]
  /** Import only this slug (articles, recipes, or pages). */
  slugFilter?: StrapiImportSlugFilter
  /** When slugFilter is set, do not auto-run prerequisite import steps. */
  omitDependencies?: boolean
  /** Resume a multi-request import (same lock, next content batch). */
  continuation?: StrapiImportContinuation
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
