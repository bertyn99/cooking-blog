import { createLogger } from 'evlog'
import { z } from 'zod'
import { STRAPI_IMPORT_STEPS } from '../../shared/strapi-import'
import { acquireStrapiImportLock, getStrapiImportStatus } from '../services/strapi-import-status'
import {
  executeStrapiImportToCompletion,
  primeStrapiImportStatus,
} from '../services/strapi-import-runner'

const payloadSchema = z.object({
  dryRun: z.boolean().optional(),
  steps: z.array(z.enum(STRAPI_IMPORT_STEPS)).optional(),
})

export default defineTask({
  meta: {
    name: 'strapi-extract',
    description: 'Import content and media from Strapi into the CMS database',
  },
  async run({ payload }) {
    const log = createLogger({ task: 'strapi-extract' })
    try {
      const parsed = payloadSchema.safeParse(payload ?? {})
      if (!parsed.success) {
        throw new Error(`Invalid strapi-extract payload: ${parsed.error.message}`)
      }

      const config = useRuntimeConfig()
      if (!config.strapiUrl) {
        throw new Error('STRAPI_URL is not configured')
      }

      const current = await getStrapiImportStatus()
      if (current.status === 'running') {
        throw new Error('Strapi import already running')
      }

      const lockId = await acquireStrapiImportLock()
      if (!lockId) {
        throw new Error('Could not acquire import lock')
      }

      const dryRun = parsed.data.dryRun ?? false
      log.set({
        strapiImport: {
          dryRun,
          steps: parsed.data.steps,
        },
      })
      await primeStrapiImportStatus(undefined, dryRun)

      const outcome = await executeStrapiImportToCompletion(
        undefined,
        {
          dryRun,
          steps: parsed.data.steps,
        },
        lockId
      )

      if (!outcome) {
        const status = await getStrapiImportStatus()
        throw new Error(status.error ?? 'Strapi import failed')
      }

      const status = await getStrapiImportStatus()
      const result = status.result ?? outcome.result
      log.set({ outcome: 'success', strapiImport: { result } })
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
