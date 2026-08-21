import type { User } from '#auth-utils'
import type { AuthenticatedApiKey } from './api-key-auth'

export type Actor
  = | { kind: 'session', user: User }
    | { kind: 'apiKey', apiKey: AuthenticatedApiKey, user: User }

export function actorUserId(actor: Actor): number {
  return actor.user.id
}

export function actorApiKeyId(actor: Actor): number | null {
  return actor.kind === 'apiKey' ? actor.apiKey.id : null
}

export function isApiKeyActor(actor: Actor): actor is Extract<Actor, { kind: 'apiKey' }> {
  return actor.kind === 'apiKey'
}
