import { createLogger } from 'evlog'
import { z } from 'zod'
import { getLocalDb } from '../db/client'
import { hydrateStrapiMedia } from '../services/hydrate-strapi-media'
import { prefersD1Database, useDb } from '../utils/db'

const payloadSchema = z.object({
  dryRun: z.boolean().optional(),
  slug: z.string().min(1).optional(),
  delayMs: z.number().int().min(0).optional(),
})

/**
 * Prefer the Node CLI for local migration (`pnpm media:hydrate`) — it avoids
 * Worker subrequest limits. This task exists for remote/ops convenience when
 * Nitro is already running against libSQL.
 */
export default defineTask({
  meta: {
    name: 'strapi-media-hydrate',
    description: 'Download remaining Strapi /uploads media and rewrite content URLs',
  },
  async run({ payload }) {
    const log = createLogger({ task: 'strapi-media-hydrate' })
    try {
      const parsed = payloadSchema.safeParse(payload ?? {})
      if (!parsed.success) {
        throw new Error(`Invalid strapi-media-hydrate payload: ${parsed.error.message}`)
      }

      const config = useRuntimeConfig()
      if (!config.strapiUrl) {
        throw new Error('STRAPI_URL is not configured')
      }

      // Force libSQL for this heavy download job when not explicitly on D1.
      const db = prefersD1Database() ? useDb() : getLocalDb()

      const result = await hydrateStrapiMedia({
        db,
        strapiUrl: config.strapiUrl,
        strapiApiToken: config.strapiApiToken || undefined,
        strapiUploadsOrigin: config.strapiUploadsOrigin || undefined,
        dryRun: parsed.data.dryRun ?? false,
        slug: parsed.data.slug,
        delayMs: parsed.data.delayMs,
        log: (message) => log.info(message),
      })

      log.set({ outcome: 'success', hydration: result })
      return { result }
    } catch (error) {
      log.error(error instanceof Error ? error : String(error), {
        outcome: 'failure',
      })
      throw error
    } finally {
      log.emit()
    }
  },
})
