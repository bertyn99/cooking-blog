import { requireAdmin } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { prefersD1Database, resolveDatabaseSource, useDb } from '../../../utils/db'
import { useMediaStorage } from '../../../utils/media-storage'
import { getCloudflareEnv } from '../../../utils/cloudflare-env'
import { pullTransferToLocal } from '../../../db/clone/transfer-pull'
import {
  TRANSFER_PULL_CONFIRM_PHRASE,
  parseTransferPullInput,
} from '../../../../shared/transfer-pull'

const PULL_ERRORS: Record<string, string> = {
  ORIGIN_REQUIRED: 'Indiquez l’URL d’origine du CMS distant.',
  ORIGIN_INVALID: 'URL d’origine invalide.',
  ORIGIN_PRIVATE: 'Les origines privées / localhost sont bloquées (CMS_TRANSFER_ALLOW_LOCAL_ORIGIN=1 pour tests).',
  API_KEY_REQUIRED: 'Collez la clé API du CMS distant.',
  SCOPES_REQUIRED: 'Sélectionnez au moins un droit à importer.',
}

function isDeployedWorkerPull(event: Parameters<typeof getCloudflareEnv>[0]) {
  if (process.env.CMS_TRANSFER_ALLOW_WORKER_MEDIA === '1') {
    return false
  }
  return prefersD1Database() && Boolean(getCloudflareEnv(event)?.DB)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  let parsed: ReturnType<typeof parseTransferPullInput>
  try {
    parsed = parseTransferPullInput(body, {
      allowPrivateOrigin: process.env.CMS_TRANSFER_ALLOW_LOCAL_ORIGIN === '1',
    })
  }
  catch (error) {
    const code = error instanceof Error ? error.message : 'VALIDATION_ERROR'
    throw createApiError('VALIDATION_ERROR', PULL_ERRORS[code] || 'Paramètres de pull invalides.')
  }

  if (!parsed.dryRun && parsed.confirm !== TRANSFER_PULL_CONFIRM_PHRASE) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Pour confirmer l’import, saisissez exactement « ${TRANSFER_PULL_CONFIRM_PHRASE} ».`,
    )
  }

  // Full media pulls exceed Workers CPU / subrequest limits — use CLI locally.
  if (
    !parsed.dryRun
    && parsed.scopes.includes('media')
    && isDeployedWorkerPull(event)
  ) {
    throw createApiError(
      'FORBIDDEN',
      'Sur Cloudflare Workers, l’import médias doit passer par le CLI '
      + '(`pnpm cms:clone:prod -- --origin=… --key=…`). '
      + 'Ici, importez articles/recettes sans le scope media, ou lancez un dry-run.',
      undefined,
      { why: 'Worker media pull blocked to avoid timeouts/subrequest limits' },
    )
  }

  const storage = useMediaStorage(event)
  const result = await pullTransferToLocal({
    db: useDb(event),
    client: {
      origin: parsed.origin,
      apiKey: parsed.apiKey,
      dryRun: parsed.dryRun,
    },
    scopes: parsed.scopes,
    limit: parsed.limit,
    transactionalWrites: resolveDatabaseSource(event) !== 'd1',
    writeMedia: async (pathname, data, contentType) => {
      await storage.putRaw(pathname, data, contentType)
    },
  })

  return {
    data: {
      origin: parsed.origin,
      dryRun: parsed.dryRun,
      scopes: parsed.scopes,
      counts: result.counts,
      databaseSource: resolveDatabaseSource(event),
    },
  }
})
