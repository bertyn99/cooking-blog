import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import type { ApiKeyScope, ContentWriteScope } from '../../shared/api-keys'
import {
  apiKeyHasContentWriteScope,
  apiKeyHasScope,
  apiKeyHasWriteScope,
} from '../../shared/api-keys'
import { canEditContent } from '../../shared/abilities'
import { ensureAgentUser } from '../db/seed/agent'
import { useQueries, useDb } from './db'
import { createApiError } from './errors'
import { getClientIp } from './client-ip'
import {
  hashApiKeySecret,
  isApiKeyExpired,
  parseBearerToken,
  toPublicApiKey,
} from './api-key-crypto'
import type { ApiKeyRow } from '../db/queries/api-keys'
import type { Actor } from './actor'
import { attachRequestUser, requireAuthenticatedSession } from './http-auth'
import { resolveDbBackedUser } from './session-user'

export type AuthenticatedApiKey = ReturnType<typeof toPublicApiKey> & {
  row: ApiKeyRow
}

function transferPullEnabled(): boolean {
  const flag = process.env.CMS_TRANSFER_PULL_ENABLED?.trim().toLowerCase()
  if (flag === '0' || flag === 'false' || flag === 'off') return false
  return true
}

function bearerPresent(event: H3Event): boolean {
  return parseBearerToken(getHeader(event, 'authorization')) !== null
}

async function lookupApiKey(event: H3Event, token: string): Promise<AuthenticatedApiKey | null> {
  const keyHash = hashApiKeySecret(token)
  const row = await useQueries(event).apiKeys.findByHash(keyHash)
  if (!row) return null
  if (isApiKeyExpired(row.expiresAt)) return null

  const publicKey = toPublicApiKey(row)

  void useQueries(event).apiKeys.touchUsage(row.id, getClientIp(event)).catch(() => undefined)

  return { ...publicKey, row }
}

/** Hash lookup + expiry + usage stamp. No scope gate. */
export async function tryResolveApiKey(event: H3Event): Promise<AuthenticatedApiKey | null> {
  const token = parseBearerToken(getHeader(event, 'authorization'))
  if (!token) return null
  return lookupApiKey(event, token)
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

  const apiKey = await tryResolveApiKey(event)
  if (!apiKey) {
    throw createApiError('UNAUTHORIZED', 'Clé API Bearer requise.')
  }

  if (!apiKeyHasScope(apiKey.scopes, requiredScope)) {
    throw createApiError(
      'FORBIDDEN',
      `Cette clé n’a pas le scope « ${requiredScope} ».`,
    )
  }

  return apiKey
}

async function buildApiKeyActor(event: H3Event, apiKey: AuthenticatedApiKey): Promise<Actor> {
  const agentUser = await ensureAgentUser(useDb(event))
  return { kind: 'apiKey', apiKey, user: agentUser }
}

/** MCP middleware: soft auth — never throws. Sets `event.context.actor` when valid write key. */
export async function tryResolveWriteActor(event: H3Event): Promise<Actor | null> {
  const apiKey = await tryResolveApiKey(event)
  if (!apiKey || !apiKeyHasWriteScope(apiKey.scopes)) return null

  const actor = await buildApiKeyActor(event, apiKey)
  event.context.actor = actor
  return actor
}

/** REST dual-auth: session editor/admin OR Bearer write key. Bearer wins over cookie. */
export async function requireWriteActor(
  event: H3Event,
  contentScope?: ContentWriteScope,
): Promise<Actor> {
  if (bearerPresent(event)) {
    const apiKey = await tryResolveApiKey(event)
    if (!apiKey) {
      throw createApiError('UNAUTHORIZED', 'Clé API Bearer invalide ou expirée.')
    }
    if (!apiKeyHasWriteScope(apiKey.scopes)) {
      throw createApiError(
        'FORBIDDEN',
        'Cette clé n’a pas le scope « write » (écriture agent).',
      )
    }
    if (contentScope && !apiKeyHasContentWriteScope(apiKey.scopes, contentScope)) {
      throw createApiError(
        'FORBIDDEN',
        `Cette clé n’a pas le scope « ${contentScope} » pour cette ressource.`,
      )
    }

    const actor = await buildApiKeyActor(event, apiKey)
    event.context.actor = actor
    attachRequestUser(event, actor.user)
    return actor
  }

  const session = await requireAuthenticatedSession(event)
  const allowed = await canEditContent.execute(session.user ?? null)
  if (!allowed) {
    throw createApiError('FORBIDDEN', 'Vous n’avez pas les droits pour cette action.')
  }

  const actor: Actor = { kind: 'session', user: session.user! }
  event.context.actor = actor
  return actor
}

/** Read actor from MCP context after middleware. Throws 403 (never 401). */
export function requireActorFromContext(
  event: H3Event,
  contentScope?: ContentWriteScope,
): Actor {
  const actor = event.context.actor
  if (!actor || actor.kind !== 'apiKey') {
    throw createApiError(
      'FORBIDDEN',
      'Clé API « write » requise pour cet outil MCP.',
    )
  }
  if (contentScope && !apiKeyHasContentWriteScope(actor.apiKey.scopes, contentScope)) {
    throw createApiError(
      'FORBIDDEN',
      `Scope « ${contentScope} » requis pour cet outil.`,
    )
  }
  return actor
}
