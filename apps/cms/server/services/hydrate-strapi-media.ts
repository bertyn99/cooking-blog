import { and, eq, isNull } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import { createDbQueries } from '../db/queries'
import {
  extractUploadPathsFromText,
  rewriteStrapiUploadsInText,
} from './extract/content-media'
import { emptyStats } from './extract/types.server'
import type { ExtractContext } from './extract/types'
import type { StrapiEntityStats } from '../../shared/strapi-import'

export interface HydrateStrapiMediaOptions {
  db: AppDb
  strapiUrl: string
  strapiApiToken?: string
  strapiUploadsOrigin?: string
  dryRun?: boolean
  /** Only hydrate this content slug (articles, recipes, or pages). */
  slug?: string
  /** Pause between media downloads (ms). Default 250. */
  delayMs?: number
  log?: (message: string) => void
}

export interface HydrateStrapiMediaResult {
  dryRun: boolean
  contentUpdated: {
    articles: number
    recipes: number
    pages: number
  }
  media: StrapiEntityStats
  pendingUploadRefs: number
  messages: string[]
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function textHasUploads(text: string | null | undefined) {
  return extractUploadPathsFromText(text ?? '').length > 0
}

/**
 * Node/CLI media hydration (Plan B): download remaining Strapi `/uploads/…`
 * references into local/R2 storage and rewrite markdown — outside Worker limits.
 */
export async function hydrateStrapiMedia(
  opts: HydrateStrapiMediaOptions,
): Promise<HydrateStrapiMediaResult> {
  const messages: string[] = []
  const log = (message: string) => {
    messages.push(message)
    opts.log?.(message)
  }

  const dryRun = opts.dryRun ?? false
  const delayMs = opts.delayMs ?? 250
  const strapiUrl = opts.strapiUrl.replace(/\/$/, '')
  const media = emptyStats()
  const contentUpdated = { articles: 0, recipes: 0, pages: 0 }

  const queries = createDbQueries(opts.db)
  let lastDownloadAt = 0

  const ctx: ExtractContext = {
    db: opts.db,
    queries,
    strapiUrl,
    strapiApiToken: opts.strapiApiToken,
    strapiUploadsOrigin: opts.strapiUploadsOrigin,
    dryRun,
    steps: [],
    event: undefined,
    log,
    onStepStart: undefined,
  }

  /** Pace downloads so Strapi / CDN is not hammered. */
  const pacedRewrite = async (text: string | null | undefined) => {
    if (!textHasUploads(text)) return text ?? null

    const paths = extractUploadPathsFromText(text ?? '')
    // Ensure delay between distinct download attempts for this field.
    if (paths.length && delayMs > 0) {
      const wait = Math.max(0, delayMs - (Date.now() - lastDownloadAt))
      if (wait > 0) await sleep(wait)
    }

    const beforeErrors = media.errors
    const beforeCreated = media.created
    const rewritten = await rewriteStrapiUploadsInText(ctx, text, media, strapiUrl)
    if (media.created > beforeCreated || media.errors > beforeErrors) {
      lastDownloadAt = Date.now()
    }
    return rewritten
  }

  log(
    dryRun
      ? 'Hydratation médias (simulation)…'
      : 'Hydratation médias (écriture locale / R2)…',
  )
  log(`Strapi : ${strapiUrl}${opts.slug ? ` — slug « ${opts.slug} »` : ''}`)

  // --- Articles ---
  const articleRows = opts.slug
    ? await opts.db
      .select({ id: schema.articles.id, slug: schema.articles.slug, content: schema.articles.content })
      .from(schema.articles)
      .where(and(eq(schema.articles.slug, opts.slug), isNull(schema.articles.deletedAt)))
      .all()
    : await opts.db
      .select({ id: schema.articles.id, slug: schema.articles.slug, content: schema.articles.content })
      .from(schema.articles)
      .where(isNull(schema.articles.deletedAt))
      .all()

  for (const row of articleRows) {
    if (!textHasUploads(row.content)) continue
    const refs = extractUploadPathsFromText(row.content ?? '')
    log(`Article « ${row.slug} » — ${refs.length} référence(s) /uploads/`)
    const content = await pacedRewrite(row.content)
    if (content && content !== row.content) {
      if (!dryRun) {
        await opts.db.update(schema.articles).set({ content }).where(eq(schema.articles.id, row.id))
      }
      contentUpdated.articles += 1
      log(`Article « ${row.slug} » — contenu ${dryRun ? 'serait mis à jour' : 'mis à jour'}`)
    }
  }

  // --- Recipes ---
  const recipeRows = opts.slug
    ? await opts.db
      .select({
        id: schema.recipes.id,
        slug: schema.recipes.slug,
        intro: schema.recipes.intro,
        step: schema.recipes.step,
      })
      .from(schema.recipes)
      .where(and(eq(schema.recipes.slug, opts.slug), isNull(schema.recipes.deletedAt)))
      .all()
    : await opts.db
      .select({
        id: schema.recipes.id,
        slug: schema.recipes.slug,
        intro: schema.recipes.intro,
        step: schema.recipes.step,
      })
      .from(schema.recipes)
      .where(isNull(schema.recipes.deletedAt))
      .all()

  for (const row of recipeRows) {
    if (!textHasUploads(row.intro) && !textHasUploads(row.step)) continue
    log(`Recette « ${row.slug} » — hydratation intro/étapes`)
    const intro = await pacedRewrite(row.intro)
    const step = await pacedRewrite(row.step)
    const changed = intro !== row.intro || step !== row.step
    if (changed) {
      if (!dryRun) {
        await opts.db.update(schema.recipes).set({ intro, step }).where(eq(schema.recipes.id, row.id))
      }
      contentUpdated.recipes += 1
      log(`Recette « ${row.slug} » — contenu ${dryRun ? 'serait mis à jour' : 'mis à jour'}`)
    }
  }

  // --- Pages ---
  const pageRows = opts.slug
    ? await opts.db
      .select({ id: schema.pages.id, slug: schema.pages.slug, content: schema.pages.content })
      .from(schema.pages)
      .where(and(eq(schema.pages.slug, opts.slug), isNull(schema.pages.deletedAt)))
      .all()
    : await opts.db
      .select({ id: schema.pages.id, slug: schema.pages.slug, content: schema.pages.content })
      .from(schema.pages)
      .where(isNull(schema.pages.deletedAt))
      .all()

  for (const row of pageRows) {
    if (!textHasUploads(row.content)) continue
    log(`Page « ${row.slug} » — hydratation`)
    const content = await pacedRewrite(row.content)
    if (content && content !== row.content) {
      if (!dryRun) {
        await opts.db.update(schema.pages).set({ content }).where(eq(schema.pages.id, row.id))
      }
      contentUpdated.pages += 1
      log(`Page « ${row.slug} » — contenu ${dryRun ? 'serait mis à jour' : 'mis à jour'}`)
    }
  }

  // Remaining /uploads/ refs after pass (scoped rows only)
  let pendingUploadRefs = 0
  for (const row of articleRows) {
    const fresh = dryRun
      ? row.content
      : (await opts.db.select({ content: schema.articles.content }).from(schema.articles).where(eq(schema.articles.id, row.id)).get())?.content
    pendingUploadRefs += extractUploadPathsFromText(fresh ?? '').length
  }
  for (const row of recipeRows) {
    const fresh = dryRun
      ? { intro: row.intro, step: row.step }
      : await opts.db.select({ intro: schema.recipes.intro, step: schema.recipes.step }).from(schema.recipes).where(eq(schema.recipes.id, row.id)).get()
    pendingUploadRefs += extractUploadPathsFromText(fresh?.intro ?? '').length
    pendingUploadRefs += extractUploadPathsFromText(fresh?.step ?? '').length
  }
  for (const row of pageRows) {
    const fresh = dryRun
      ? row.content
      : (await opts.db.select({ content: schema.pages.content }).from(schema.pages).where(eq(schema.pages.id, row.id)).get())?.content
    pendingUploadRefs += extractUploadPathsFromText(fresh ?? '').length
  }

  log(
    `Médias — créés ${media.created}, inchangés ${media.skipped}, erreurs ${media.errors}`,
  )
  log(
    `Contenu mis à jour — articles ${contentUpdated.articles}, recettes ${contentUpdated.recipes}, pages ${contentUpdated.pages}`,
  )
  log(
    pendingUploadRefs > 0
      ? `Il reste ${pendingUploadRefs} référence(s) /uploads/ (échecs ou simulation).`
      : 'Aucune référence /uploads/ restante sur le périmètre scanné.',
  )
  if (dryRun) log('Simulation terminée (aucune écriture).')
  else log('Hydratation terminée.')

  return {
    dryRun,
    contentUpdated,
    media,
    pendingUploadRefs,
    messages,
  }
}
