import type { H3Event } from 'h3'
import type { StrapiImportSlugFilter } from '../../../shared/strapi-import'
import type { AppDb } from '../../db/create-db'
import { extractArticles } from './articles'
import { extractCategories } from './categories'
import { extractCategoryArticles } from './category-articles'
import { extractPages } from './pages'
import { extractRecipes } from './recipes'
import { createStrapiClient } from './strapi-client'
import {
  emptyStats,
  resolveImportSteps,
  STRAPI_IMPORT_STEPS,
  formatStepStatsMessage,
  type ExtractContext,
  type StrapiImportResult,
  type StrapiImportStep,
} from './types'

export interface RunStrapiImportOptions {
  db: AppDb
  strapiUrl: string
  strapiApiToken?: string
  dryRun?: boolean
  steps?: StrapiImportStep[]
  slugFilter?: StrapiImportSlugFilter
  omitDependencies?: boolean
  event?: H3Event
  onLog?: (message: string) => void | Promise<void>
  onStepStart?: (step: StrapiImportStep) => void | Promise<void>
}

export async function runStrapiImport(opts: RunStrapiImportOptions): Promise<StrapiImportResult> {
  const messages: string[] = []
  const log = async (message: string) => {
    messages.push(message)
    await opts.onLog?.(message)
  }

  const steps = opts.steps?.length ? opts.steps : [...STRAPI_IMPORT_STEPS]
  const ordered = resolveImportSteps(steps, { omitDependencies: opts.omitDependencies })
  if (!opts.omitDependencies && ordered.length > steps.length) {
    await log(`Étapes requises ajoutées automatiquement : ${ordered.join(', ')}`)
  }
  if (opts.slugFilter?.slug) {
    await log(`Import ciblé : slug « ${opts.slugFilter.slug} »${opts.slugFilter.locale ? ` (${opts.slugFilter.locale})` : ''}.`)
  }

  const client = createStrapiClient({
    baseUrl: opts.strapiUrl,
    token: opts.strapiApiToken,
  })

  await log(`Connexion à Strapi (${opts.strapiUrl})…`)
  const ping = await client.ping()
  await log(`Strapi accessible — ${ping.totalArticles ?? 0} article(s) détecté(s).`)

  const ctx: ExtractContext = {
    db: opts.db,
    strapiUrl: opts.strapiUrl,
    strapiApiToken: opts.strapiApiToken,
    dryRun: opts.dryRun ?? false,
    steps: ordered,
    slugFilter: opts.slugFilter,
    event: opts.event,
    log: (message) => {
      messages.push(message)
      void opts.onLog?.(message)
    },
    onStepStart: opts.onStepStart,
  }

  const media = emptyStats()
  const result: StrapiImportResult = {
    dryRun: ctx.dryRun,
    finishedAt: new Date().toISOString(),
    steps: {},
    media,
    messages,
  }

  for (const step of ordered) {
    await ctx.onStepStart?.(step)
    await log(`Étape : ${step}`)
    switch (step) {
      case 'category-articles':
        result.steps[step] = await extractCategoryArticles(ctx)
        break
      case 'categories':
        result.steps[step] = await extractCategories(ctx, media)
        break
      case 'articles':
        result.steps[step] = await extractArticles(ctx, media)
        break
      case 'recipes':
        result.steps[step] = await extractRecipes(ctx, media)
        break
      case 'pages':
        result.steps[step] = await extractPages(ctx, media)
        break
      default: {
        const _exhaustive: never = step
        throw new Error(`Unknown import step: ${String(_exhaustive)}`)
      }
    }
    const stepStats = result.steps[step]
    if (stepStats) {
      await log(formatStepStatsMessage(step, stepStats))
    }
  }

  await log(
    `Médias — créés ${media.created}, inchangés ${media.skipped}, erreurs ${media.errors}`,
  )

  const allStepsUnchanged = Object.values(result.steps).every(
    s => s && s.created === 0 && s.updated === 0 && s.errors === 0 && s.skipped > 0,
  )
  if (allStepsUnchanged && ordered.length > 0) {
    await log('Toutes les étapes sélectionnées sont déjà synchronisées avec Strapi.')
  }

  if (ctx.dryRun) {
    await log('Simulation terminée (aucune écriture en base).')
  }
  else {
    await log('Import terminé.')
  }

  result.finishedAt = new Date().toISOString()
  return result
}
