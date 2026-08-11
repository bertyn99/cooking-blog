import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import type { ApiKeyScope } from '../../shared/api-keys'
import { apiKeyHasScope } from '../../shared/api-keys'
import { useQueries } from './db'
import { createApiError } from './errors'
import { getClientIp } from './client-ip'
import {
  hashApiKeySecret,
  isApiKeyExpired,
  parseBearerToken,
  toPublicApiKey,
} from './api-key-crypto'
import type { ApiKeyRow } from '../db/queries/api-keys'

export type AuthenticatedApiKey = ReturnType<typeof toPublicApiKey> & {
  row: ApiKeyRow
}

function transferPullEnabled(): boolean {
  const flag = process.env.CMS_TRANSFER_PULL_ENABLED?.trim().toLowerCase()
  if (flag === '0' || flag === 'false' || flag === 'off') return false
  return true
}

export async function requireApiKey(
  event: H3Event,
  requiredScope: ApiKeyScope,
): Promise<AuthenticatedApiKey> {
  if (!transferPullEnabled()) {
    throw createApiError(
      'FORBIDDEN',
      'Le transfert pull est désactivé sur cette instance.',
      undefined,
      { why: 'CMS_TRANSFER_PULL_ENABLED is off' },
    )
  }

  const token = parseBearerToken(getHeader(event, 'authorization'))
  if (!token) {
    throw createApiError('UNAUTHORIZED', 'Clé API Bearer requise.')
  }

  const keyHash = hashApiKeySecret(token)
  const row = await useQueries(event).apiKeys.findByHash(keyHash)
  if (!row) {
    throw createApiError('UNAUTHORIZED', 'Clé API invalide ou révoquée.')
  }

  if (isApiKeyExpired(row.expiresAt)) {
    throw createApiError('UNAUTHORIZED', 'Clé API expirée.')
  }

  const publicKey = toPublicApiKey(row)
  if (!apiKeyHasScope(publicKey.scopes, requiredScope)) {
    throw createApiError(
      'FORBIDDEN',
      `Cette clé n’a pas le scope « ${requiredScope} ».`,
    )
  }

  // Fire-and-forget usage stamp — do not block the response on write latency.
  void useQueries(event).apiKeys.touchUsage(row.id, getClientIp(event)).catch(() => undefined)

  return { ...publicKey, row }
}
