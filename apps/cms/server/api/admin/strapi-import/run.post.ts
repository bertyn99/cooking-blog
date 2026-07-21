import { z } from 'zod'
import { canAccessAdminApi } from '../../../../shared/abilities'
import { STRAPI_IMPORT_STEPS, type StrapiImportRunBody } from '../../../../shared/strapi-import'
import { executeStrapiImportJob, primeStrapiImportStatus } from '../../../services/strapi-import-runner'
import {
  acquireStrapiImportLock,
  getStrapiImportStatus,
} from '../../../services/strapi-import-status'
import { runInBackground } from '../../../utils/background-task'
import { createApiError } from '../../../utils/errors'
import { validateBody } from '../../../utils/validate'

const bodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  steps: z.array(z.enum(STRAPI_IMPORT_STEPS)).optional(),
  slugFilter: z.object({
    slug: z.string().min(1),
    locale: z.string().min(1).optional(),
  }).optional(),
  omitDependencies: z.boolean().optional(),
}) satisfies z.ZodType<StrapiImportRunBody, z.ZodTypeDef, unknown>

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const current = await getStrapiImportStatus(event)
  if (current.status === 'running') {
    throw createError({ statusCode: 409, statusMessage: 'Un import est déjà en cours' })
  }

  const body = validateBody(bodySchema, await readBody(event))
  const config = useRuntimeConfig(event)

  if (!config.strapiUrl) {
    throw createApiError('VALIDATION_ERROR', 'STRAPI_URL non configuré')
  }

  const lockId = await acquireStrapiImportLock(event)
  if (!lockId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Import verrouillé — réessayez plus tard ou réinitialisez l’état',
    })
  }

  await primeStrapiImportStatus(event, body.dryRun)

  const jobInput = {
    dryRun: body.dryRun,
    steps: body.steps,
    slugFilter: body.slugFilter,
    omitDependencies: body.omitDependencies,
  }

  const waitUntil = event.context.cloudflare as { context?: { waitUntil?: (p: Promise<unknown>) => void } } | undefined
  const runsInBackground = Boolean(waitUntil?.context?.waitUntil)

  if (runsInBackground) {
    runInBackground(event, async () => {
      await executeStrapiImportJob(event, jobInput, lockId)
    })
    setResponseStatus(event, 202)
    return {
      accepted: true,
      completed: false,
      dryRun: body.dryRun,
      message: 'Import démarré en arrière-plan. Suivez la progression dans le journal.',
    }
  }

  await executeStrapiImportJob(event, jobInput, lockId)
  const status = await getStrapiImportStatus(event)

  return {
    accepted: true,
    completed: true,
    dryRun: body.dryRun,
    result: status.result,
    status,
    message: status.result?.messages.at(-1) ?? 'Import terminé.',
  }
})
