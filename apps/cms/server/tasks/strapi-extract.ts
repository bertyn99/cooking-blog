import { z } from 'zod'
import { STRAPI_IMPORT_STEPS } from '../../shared/strapi-import'
import {
  acquireStrapiImportLock,
  getStrapiImportStatus,
} from '../services/strapi-import-status'
import { executeStrapiImportJob, primeStrapiImportStatus } from '../services/strapi-import-runner'

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
    await primeStrapiImportStatus(undefined, dryRun)

    await executeStrapiImportJob(undefined, {
      dryRun,
      steps: parsed.data.steps,
    }, lockId)

    const status = await getStrapiImportStatus()
    return { result: status.result }
  },
})
