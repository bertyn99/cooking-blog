import type { H3Event } from 'h3'
import type {
  StrapiImportAccumulatedStats,
  StrapiImportBatchedStep,
  StrapiImportContinuation,
  StrapiImportSlugFilter,
} from '../../../shared/strapi-import'
import {
  isStrapiImportBatchedStep,
  STRAPI_IMPORT_CONTENT_BATCH_SIZE,
} from '../../../shared/strapi-import'
import type { AppDb } from '../../db/create-db'
import { createDbQueries } from '../../db/queries'
import {
  loadImportStepSlugs,
  saveImportStepSlugs,
} from '../strapi-import-status'
import { extractArticles } from './articles'
import { extractCategories } from './categories'
import { extractCategoryArticles } from './category-articles'
import { extractPages, reconcilePageParents } from './pages'
import { extractRecipes } from './recipes'
import { createStrapiClient } from './strapi-client'
import {
  emptyStats,
  resolveImportSteps,
  STRAPI_IMPORT_STEPS,
  formatStepStatsMessage,
  type ExtractContext,
  type StrapiEntityStats,
  type StrapiImportResult,
  type StrapiImportStep,
} from './types'

export interface RunStrapiImportOptions {
  db: AppDb
  strapiUrl: string
  strapiApiToken?: string
  strapiUploadsOrigin?: string
  dryRun?: boolean
  steps?: StrapiImportStep[]
  slugFilter?: StrapiImportSlugFilter
  omitDependencies?: boolean
  continuation?: StrapiImportContinuation
  lockId?: string
  event?: H3Event
  onLog?: (message: string) => void | Promise<void>
  onStepStart?: (step: StrapiImportStep) => void | Promise<void>
}

function mergeStepStats(
  existing: StrapiEntityStats | undefined,
  incoming: StrapiEntityStats | undefined,
): StrapiEntityStats | undefined {
  if (!incoming) return existing
  if (!existing) return { ...incoming }
  return {
    created: existing.created + incoming.created,
    updated: existing.updated + incoming.updated,
    skipped: existing.skipped + incoming.skipped,
    errors: existing.errors + incoming.errors,
  }
}

function mergeAccumulated(
  base: StrapiImportAccumulatedStats,
  steps: Partial<Record<StrapiImportStep, StrapiEntityStats>>,
  media: StrapiEntityStats,
): StrapiImportAccumulatedStats {
  const mergedSteps: Partial<Record<StrapiImportStep, StrapiEntityStats>> = { ...base.steps }
  for (const [key, value] of Object.entries(steps) as [StrapiImportStep, StrapiEntityStats][]) {
    mergedSteps[key] = mergeStepStats(mergedSteps[key], value) ?? value
  }
  return {
    steps: mergedSteps,
    media: mergeStepStats(base.media, media) ?? { ...media },
  }
}

function emptyAccumulated(): StrapiImportAccumulatedStats {
  return { steps: {}, media: emptyStats() }
}

async function runBatchedContentStep(
  step: StrapiImportBatchedStep,
  ctx: ExtractContext,
  media: StrapiEntityStats,
  slugBatch: string[],
) {
  switch (step) {
    case 'articles':
      return extractArticles(ctx, media, slugBatch)
    case 'recipes':
      return extractRecipes(ctx, media, slugBatch)
    case 'pages':
      return extractPages(ctx, media, slugBatch)
    default: {
      const _exhaustive: never = step
      throw new Error(`Unknown batched step: ${String(_exhaustive)}`)
    }
  }
}

function buildContinuation(opts: {
  lockId: string
  dryRun: boolean
  steps: StrapiImportStep[]
  stepIndex: number
  batch?: StrapiImportContinuation['batch']
  accumulated: StrapiImportAccumulatedStats
}): StrapiImportContinuation {
  return {
    lockId: opts.lockId,
    dryRun: opts.dryRun,
    steps: opts.steps,
    stepIndex: opts.stepIndex,
    batch: opts.batch,
    accumulated: opts.accumulated,
  }
}

/**
 * One Worker-safe unit of work per call when not dry-run / not slug-filtered:
 * - list slugs for a content step, or
 * - import one content item, or
 * - run one non-batched step,
 * then pause with a continuation before the next unit.
 */
export async function runStrapiImport(opts: RunStrapiImportOptions): Promise<StrapiImportResult> {
  const messages: string[] = []
  const log = async (message: string) => {
    messages.push(message)
    await opts.onLog?.(message)
  }

  const dryRun = opts.continuation?.dryRun ?? opts.dryRun ?? false
  const lockId = opts.continuation?.lockId ?? opts.lockId

  const stepsInput = opts.continuation?.steps?.length
    ? [...opts.continuation.steps]
    : (opts.steps?.length ? opts.steps : [...STRAPI_IMPORT_STEPS])

  const ordered = resolveImportSteps(stepsInput, {
    omitDependencies: opts.continuation ? true : opts.omitDependencies,
  })

  if (!opts.continuation && !opts.omitDependencies && ordered.length > stepsInput.length) {
    await log(`Étapes requises ajoutées automatiquement : ${ordered.join(', ')}`)
  }
  if (opts.slugFilter?.slug) {
    await log(`Import ciblé : slug « ${opts.slugFilter.slug} »${opts.slugFilter.locale ? ` (${opts.slugFilter.locale})` : ''}.`)
  }

  const client = createStrapiClient({
    baseUrl: opts.strapiUrl,
    token: opts.strapiApiToken,
    uploadsOrigin: opts.strapiUploadsOrigin,
  })

  if (opts.continuation) {
    const step = ordered[opts.continuation.stepIndex]
    const label = opts.continuation.batch
      ? `${opts.continuation.batch.step} #${opts.continuation.batch.nextIndex + 1}`
      : (step ?? '?')
    await log(`Reprise — ${label}.`)
  }
  else {
    await log(`Connexion à Strapi (${opts.strapiUrl})…`)
    const ping = await client.ping()
    await log(`Strapi accessible — ${ping.totalArticles ?? 0} article(s) détecté(s).`)
  }

  const ctx: ExtractContext = {
    db: opts.db,
    queries: createDbQueries(opts.db),
    strapiUrl: opts.strapiUrl,
    strapiApiToken: opts.strapiApiToken,
    strapiUploadsOrigin: opts.strapiUploadsOrigin,
    dryRun,
    steps: ordered,
    slugFilter: opts.slugFilter,
    event: opts.event,
    log: (message) => {
      messages.push(message)
      void opts.onLog?.(message)
    },
    onStepStart: opts.onStepStart,
  }

  const prior = opts.continuation?.accumulated ?? emptyAccumulated()
  const media = emptyStats()
  const result: StrapiImportResult = {
    dryRun,
    finishedAt: new Date().toISOString(),
    steps: {},
    media,
    messages,
  }

  const useWorkerBatching = !dryRun && !opts.slugFilter

  // Dry-run / targeted slug: single-shot (no Worker subrequest pressure from downloads).
  if (!useWorkerBatching) {
    for (const step of ordered) {
      await ctx.onStepStart?.(step)
      await log(`Étape : ${step}`)
      result.steps[step] = await runFullStep(step, ctx, media)
      const stepStats = result.steps[step]
      if (stepStats) await log(formatStepStatsMessage(step, stepStats))
    }
    return finalizeResult(result, log, dryRun)
  }

  if (!lockId) {
    throw new Error('Import par lots : identifiant de verrou manquant.')
  }

  let stepIndex = opts.continuation?.stepIndex ?? 0

  // Skip ahead only when resuming — never re-run finished steps in this request.
  if (stepIndex >= ordered.length) {
    const accumulated = mergeAccumulated(prior, result.steps, media)
    result.steps = accumulated.steps
    result.media = accumulated.media
    return finalizeResult(result, log, dryRun)
  }

  const step = ordered[stepIndex]!
  await ctx.onStepStart?.(step)
  await log(`Étape : ${step}`)

  if (!isStrapiImportBatchedStep(step)) {
    result.steps[step] = await runFullStep(step, ctx, media)
    const stepStats = result.steps[step]
    if (stepStats) await log(formatStepStatsMessage(step, stepStats))

    const accumulated = mergeAccumulated(prior, result.steps, media)
    result.steps = accumulated.steps
    result.media = accumulated.media

    const nextIndex = stepIndex + 1
    if (nextIndex < ordered.length) {
      result.continuation = buildContinuation({
        lockId,
        dryRun,
        steps: ordered,
        stepIndex: nextIndex,
        accumulated,
      })
      await log('Pause — étape suivante (budget Worker).')
      await logMedia(log, accumulated.media)
      result.finishedAt = new Date().toISOString()
      return result
    }

    return finalizeResult(result, log, dryRun)
  }

  // Batched content step
  const batchStep = step
  const existingBatch = opts.continuation?.batch?.step === batchStep
    ? opts.continuation.batch
    : undefined

  if (!existingBatch) {
    // Unit: list slugs only — do not download media in the same request.
    await log(`Indexation des slugs Strapi (${batchStep})…`)
    const slugs = await client.listSlugs(batchStep)
    await saveImportStepSlugs(opts.event, lockId, batchStep, slugs)
    await log(`${slugs.length} slug(s) ${batchStep}.`)

    const accumulated = mergeAccumulated(prior, result.steps, media)
    result.steps = accumulated.steps
    result.media = accumulated.media

    if (slugs.length === 0) {
      const nextIndex = stepIndex + 1
      if (nextIndex < ordered.length) {
        result.continuation = buildContinuation({
          lockId,
          dryRun,
          steps: ordered,
          stepIndex: nextIndex,
          accumulated,
        })
        await log('Pause — étape suivante (aucun contenu).')
        result.finishedAt = new Date().toISOString()
        return result
      }
      return finalizeResult(result, log, dryRun)
    }

    result.continuation = buildContinuation({
      lockId,
      dryRun,
      steps: ordered,
      stepIndex,
      batch: { step: batchStep, nextIndex: 0 },
      accumulated,
    })
    await log('Pause — début de l’import contenu (1 élément / requête).')
    result.finishedAt = new Date().toISOString()
    return result
  }

  if (existingBatch.reconcile && batchStep === 'pages') {
    await reconcilePageParents(ctx)
    const accumulated = mergeAccumulated(prior, result.steps, media)
    result.steps = accumulated.steps
    result.media = accumulated.media
    const nextIndex = stepIndex + 1
    if (nextIndex < ordered.length) {
      result.continuation = buildContinuation({
        lockId,
        dryRun,
        steps: ordered,
        stepIndex: nextIndex,
        accumulated,
      })
      await log('Pause — pages liées, étape suivante.')
      await logMedia(log, accumulated.media)
      result.finishedAt = new Date().toISOString()
      return result
    }
    return finalizeResult(result, log, dryRun)
  }

  const slugs = await loadImportStepSlugs(opts.event, lockId, batchStep)
  if (!slugs?.length) {
    throw new Error(`Liste de slugs manquante pour ${batchStep} (verrou ${lockId}).`)
  }

  const startIndex = existingBatch.nextIndex
  const endIndex = Math.min(startIndex + STRAPI_IMPORT_CONTENT_BATCH_SIZE, slugs.length)
  const slugBatch = slugs.slice(startIndex, endIndex)

  await log(`Lot ${startIndex + 1}–${endIndex} / ${slugs.length} (${batchStep}).`)
  const stepStats = await runBatchedContentStep(batchStep, ctx, media, slugBatch)
  result.steps[step] = mergeStepStats(undefined, stepStats)
  await log(formatStepStatsMessage(step, stepStats))

  const accumulated = mergeAccumulated(prior, result.steps, media)
  result.steps = accumulated.steps
  result.media = accumulated.media

  if (endIndex < slugs.length) {
    result.continuation = buildContinuation({
      lockId,
      dryRun,
      steps: ordered,
      stepIndex,
      batch: { step: batchStep, nextIndex: endIndex },
      accumulated,
    })
    await log('Pause — reprise automatique (téléchargements médias).')
    await logMedia(log, accumulated.media)
    result.finishedAt = new Date().toISOString()
    return result
  }

  // Finished content items — pages need a separate parent-link unit.
  if (batchStep === 'pages') {
    result.continuation = buildContinuation({
      lockId,
      dryRun,
      steps: ordered,
      stepIndex,
      batch: { step: 'pages', nextIndex: endIndex, reconcile: true },
      accumulated,
    })
    await log('Pause — réconciliation des parents de pages.')
    await logMedia(log, accumulated.media)
    result.finishedAt = new Date().toISOString()
    return result
  }

  const nextIndex = stepIndex + 1
  if (nextIndex < ordered.length) {
    result.continuation = buildContinuation({
      lockId,
      dryRun,
      steps: ordered,
      stepIndex: nextIndex,
      accumulated,
    })
    await log(`Pause — ${batchStep} terminé, étape suivante.`)
    await logMedia(log, accumulated.media)
    result.finishedAt = new Date().toISOString()
    return result
  }

  return finalizeResult(result, log, dryRun)
}

async function runFullStep(
  step: StrapiImportStep,
  ctx: ExtractContext,
  media: StrapiEntityStats,
): Promise<StrapiEntityStats> {
  switch (step) {
    case 'category-articles':
      return extractCategoryArticles(ctx)
    case 'categories':
      return extractCategories(ctx, media)
    case 'articles':
      return extractArticles(ctx, media)
    case 'recipes':
      return extractRecipes(ctx, media)
    case 'pages':
      return extractPages(ctx, media)
    default: {
      const _exhaustive: never = step
      throw new Error(`Unknown import step: ${String(_exhaustive)}`)
    }
  }
}

async function logMedia(log: (m: string) => Promise<void>, media: StrapiEntityStats) {
  await log(
    `Médias (cumul) — créés ${media.created}, inchangés ${media.skipped}, erreurs ${media.errors}`,
  )
}

async function finalizeResult(
  result: StrapiImportResult,
  log: (m: string) => Promise<void>,
  dryRun: boolean,
): Promise<StrapiImportResult> {
  await log(
    `Médias — créés ${result.media.created}, inchangés ${result.media.skipped}, erreurs ${result.media.errors}`,
  )

  const allStepsUnchanged = Object.values(result.steps).every(
    s => s && s.created === 0 && s.updated === 0 && s.errors === 0 && s.skipped > 0,
  )
  if (allStepsUnchanged && Object.keys(result.steps).length > 0) {
    await log('Toutes les étapes sélectionnées sont déjà synchronisées avec Strapi.')
  }

  if (dryRun) {
    await log('Simulation terminée (aucune écriture en base).')
  }
  else {
    await log('Import terminé.')
  }

  result.finishedAt = new Date().toISOString()
  return result
}
