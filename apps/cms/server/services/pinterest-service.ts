import { generateText } from 'ai'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from 'nuxt/server'
import type { DbQueries } from '../db/queries'
import { WORKERS_AI_MODEL } from '../../shared/workers-ai-model'
import { absolutePublicUrl } from '#shared/public-site-paths'
import {
  buildNotBeforeSchedule,
  buildPinCopyPrompt,
  buildPinImageUrl,
  createPinterestPin,
  DAILY_PIN_CAP,
  extractContentImagePaths,
  fallbackPinCopy,
  getPinterestConfig,
  isPinterestConfigured,
  MAX_PINS_PER_CONTENT,
  parsePinCopyResponse,
  resolveBoardId,
} from '../utils/pinterest'
import { createCmsWorkersAI } from '../utils/cms-workers-ai'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { useQueries } from '../utils/db'

export function createPinterestService(queries: DbQueries, event?: H3Event) {
  const { pinterest, publishing } = queries
  const config = getPinterestConfig()

  /**
   * Enqueue pin rows for one published content item — cover first, then body
   * images spread 72h apart (same-URL spacing rule), capped at 5 per content.
   * Idempotent: unique (content_type, content_id, image_path).
   * Best-effort by contract: never throws (publish must not fail on Pinterest).
   */
  async function enqueueForContent(contentType: 'articles' | 'recipes', id: number): Promise<number> {
    try {
      const meta = await pinterest.loadContentMeta(contentType, id)
      if (!meta) {
        return 0
      }

      const candidates: Array<{ imagePath: string, isCover: boolean }> = []
      if (meta.coverBlobPathname) {
        candidates.push({ imagePath: meta.coverBlobPathname, isCover: true })
      }
      for (const path of extractContentImagePaths(meta.content)) {
        if (path !== meta.coverBlobPathname) {
          candidates.push({ imagePath: path, isCover: false })
        }
      }

      const existing = await pinterest.existingImageKeys(contentType, id)
      const fresh = candidates.filter(c => !existing.has(c.imagePath)).slice(0, MAX_PINS_PER_CONTENT)
      if (fresh.length === 0) {
        return 0
      }

      const schedule = buildNotBeforeSchedule(fresh.length)
      let enqueued = 0
      for (const [i, candidate] of fresh.entries()) {
        const inserted = await pinterest.insertPendingPin({
          contentType,
          contentId: id,
          imagePath: candidate.imagePath,
          isCover: candidate.isCover,
          notBefore: schedule[i],
        })
        if (inserted) {
          enqueued++
        }
      }
      return enqueued
    }
    catch {
      return 0
    }
  }

  /** Generate the pin title + description (Workers AI, deterministic fallback). */
  async function generateCopy(meta: {
    title: string
    excerpt: string
    isCover: boolean
  }): Promise<{ title: string, description: string }> {
    const input = {
      title: meta.title,
      excerpt: (meta.excerpt || meta.title).replace(/[#>*_[\]()`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400),
      isCover: meta.isCover,
    }
    const env = getCloudflareEnv(event)
    if (!env?.AI) {
      return fallbackPinCopy(input)
    }
    try {
      const workersAi = createCmsWorkersAI(env.AI, { metadata: { feature: 'pinterest-pin-copy' } })
      const generated = await generateText({
        model: workersAi(WORKERS_AI_MODEL),
        prompt: buildPinCopyPrompt(input),
        maxOutputTokens: 400,
      })
      return parsePinCopyResponse(generated.text ?? '', input)
    }
    catch {
      return fallbackPinCopy(input)
    }
  }

  /**
   * Drain due `pending` rows — respects the daily cadence cap (3–10/day rule).
   * Never throws: pin failures are recorded per-row.
   */
  async function processDue(options: { limit?: number } = {}): Promise<{
    attempted: number
    pinned: number
    failed: number
    skippedByCap: number
    configMissing: boolean
  }> {
    if (!isPinterestConfigured(config)) {
      return { attempted: 0, pinned: 0, failed: 0, skippedByCap: 0, configMissing: true }
    }

    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)
    const alreadyToday = await pinterest.countPinnedSince(dayStart.toISOString())
    let remaining = Math.max(0, DAILY_PIN_CAP - alreadyToday)

    const rows = await pinterest.dueRows(options.limit ?? remaining + 4)
    let pinned = 0
    let failed = 0
    let attempted = 0
    let skippedByCap = 0

    for (const row of rows) {
      if (remaining <= 0) {
        skippedByCap++
        continue
      }

      const contentType = row.contentType as 'articles' | 'recipes'
      const meta = await pinterest.loadContentMeta(contentType, row.contentId)
      if (!meta) {
        // Unpublished/deleted since enqueue — drop the row quietly.
        await pinterest.markError(row.id, 'content_unpublished')
        attempted++
        continue
      }

      attempted++
      const publicPath = await publishing.resolvePublicPaths(contentType, [meta.id]).then(p => p[0])
      if (!publicPath) {
        await pinterest.markError(row.id, 'public_path_unresolved')
        failed++
        continue
      }

      const siteUrl = String(useRuntimeConfig().public?.siteUrl ?? '').replace(/\/$/, '')
      const boardId = resolveBoardId(config, meta.categorySlug)
      const copy = await generateCopy({ title: meta.title, excerpt: meta.excerpt, isCover: row.isCover })
      const result = await createPinterestPin(config.accessToken, {
        boardId,
        title: copy.title,
        description: copy.description,
        imageUrl: buildPinImageUrl(siteUrl, row.imagePath),
        link: absolutePublicUrl(siteUrl, publicPath),
      })

      if (result.ok && result.pinId) {
        await pinterest.markPinned(row.id, {
          pinId: result.pinId,
          boardId,
          title: copy.title,
          description: copy.description,
        })
        pinned++
        remaining--
      }
      else {
        await pinterest.markError(row.id, result.error ?? 'unknown_error')
        failed++
      }
    }

    return { attempted, pinned, failed, skippedByCap, configMissing: false }
  }

  /** Backfill: enqueue every published article/recipe that has no pin rows yet. */
  async function backfill(): Promise<{ articles: number, recipes: number, enqueued: number }> {
    let enqueued = 0
    const counts: { articles: number, recipes: number, enqueued: number } = { articles: 0, recipes: 0, enqueued: 0 }
    for (const contentType of ['articles', 'recipes'] as const) {
      const ids = await pinterest.publishedWithoutPins(contentType)
      counts[contentType] = ids.length
      for (const id of ids) {
        enqueued += await enqueueForContent(contentType, id)
      }
    }
    counts.enqueued = enqueued
    return counts
  }

  async function summary() {
    return pinterest.summary()
  }

  return { enqueueForContent, processDue, backfill, summary }
}

export function usePinterestService(event?: H3Event) {
  return createPinterestService(useQueries(event), event)
}
