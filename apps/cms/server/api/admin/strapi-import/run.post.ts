import { z } from 'zod'
import { canAccessImport } from '../../../../shared/abilities'
import {
  STRAPI_IMPORT_BATCHED_STEPS,
  STRAPI_IMPORT_STEPS,
} from '../../../../shared/strapi-import'
import type { StrapiImportRunBody } from '../../../../shared/strapi-import'
import { executeStrapiImportJob, primeStrapiImportStatus } from '../../../services/strapi-import-runner'
import {
  acquireStrapiImportLock,
  getStrapiImportStatus,
  refreshStrapiImportLock,
} from '../../../services/strapi-import-status'
import { useKvStore } from '../../../utils/kv'
import { createApiError } from '../../../utils/errors'
import { validateBody } from '../../../utils/validate'
import { requireAbility } from '../../../utils/http-auth'

const entityStatsSchema = z.object({
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.number(),
})

const continuationSchema = z.object({
  lockId: z.string().min(1),
  dryRun: z.boolean(),
  steps: z.array(z.enum(STRAPI_IMPORT_STEPS)),
  stepIndex: z.number().int().min(0),
  batch: z.object({
    step: z.enum(STRAPI_IMPORT_BATCHED_STEPS),
    nextIndex: z.number().int().min(0),
    reconcile: z.boolean().optional(),
  }).optional(),
  accumulated: z.object({
    steps: z.record(z.string(), entityStatsSchema).default({}),
    media: entityStatsSchema,
  }),
})

const bodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  steps: z.array(z.enum(STRAPI_IMPORT_STEPS)).optional(),
  slugFilter: z.object({
    slug: z.string().min(1),
    locale: z.string().min(1).optional(),
  }).optional(),
  omitDependencies: z.boolean().optional(),
  continuation: continuationSchema.optional(),
})

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessImport)

  const body = validateBody(bodySchema, await readBody(event))
  const config = useRuntimeConfig(event)

  if (!config.strapiUrl) {
    throw createApiError('VALIDATION_ERROR', 'STRAPI_URL non configuré')
  }

  const current = await getStrapiImportStatus(event)
  let lockId: string

  if (body.continuation) {
    if (current.status !== 'running') {
      throw createApiError('CONFLICT', 'Aucun import en cours à reprendre.')
    }
    const store = useKvStore(event)
    const lock = await store.get<{ id: string }>('strapi-import:lock')
    if (lock?.id !== body.continuation.lockId) {
      throw createApiError('CONFLICT', 'Verrou d’import invalide.')
    }
    const refreshed = await refreshStrapiImportLock(event, body.continuation.lockId)
    if (!refreshed) {
      throw createApiError('CONFLICT', 'Verrou d’import expiré.')
    }
    lockId = body.continuation.lockId
  }
  else {
    if (current.status === 'running') {
      throw createApiError('CONFLICT', 'Un import est déjà en cours.')
    }

    const acquired = await acquireStrapiImportLock(event)
    if (!acquired) {
      throw createApiError(
        'CONFLICT',
        'Import verrouillé — réessayez plus tard ou réinitialisez l’état.',
      )
    }
    lockId = acquired

    await primeStrapiImportStatus(event, body.dryRun)
  }

  const jobInput: Required<Pick<StrapiImportRunBody, 'dryRun'>> & StrapiImportRunBody = body.continuation
    ? {
        dryRun: body.continuation.dryRun,
        continuation: body.continuation,
        omitDependencies: true,
      }
    : {
        dryRun: body.dryRun,
        steps: body.steps,
        slugFilter: body.slugFilter,
        omitDependencies: body.omitDependencies,
      }

  const outcome = await executeStrapiImportJob(event, jobInput, lockId)

  if (!outcome) {
    const status = await getStrapiImportStatus(event)
    throw createApiError('INTERNAL_ERROR', status.error ?? 'Import échoué.')
  }

  if (outcome.partial && outcome.result.continuation) {
    const status = await getStrapiImportStatus(event)
    return {
      accepted: true,
      completed: false,
      dryRun: jobInput.dryRun,
      continuation: outcome.result.continuation,
      result: outcome.result,
      status,
      message: outcome.result.messages.at(-1) ?? 'Import en cours…',
    }
  }

  const status = await getStrapiImportStatus(event)

  return {
    accepted: true,
    completed: true,
    dryRun: jobInput.dryRun,
    result: status.result ?? outcome.result,
    status,
    message: status.result?.messages.at(-1) ?? 'Import terminé.',
  }
})
