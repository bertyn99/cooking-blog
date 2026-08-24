import type { H3Event } from 'nitro/h3'
import { apiKeyHasScope, type ContentWriteScope } from '../../../shared/api-keys'
import { createApiError } from '../../utils/errors'
import { requireActorFromContext } from '../../utils/write-auth'
import { isApiKeyActor, type Actor } from '../../utils/actor'

export function requireMcpTool(contentScope?: ContentWriteScope): {
  event: H3Event
  actor: Actor
} {
  const event = useEvent()
  return {
    event,
    actor: requireActorFromContext(event, contentScope),
  }
}

export function requireMcpMediaTool(): { event: H3Event, actor: Actor } {
  const { event, actor } = requireMcpTool()
  if (!isApiKeyActor(actor) || !apiKeyHasScope(actor.apiKey.scopes, 'media')) {
    throw createApiError('FORBIDDEN', 'Scope « media » requis pour cet outil.')
  }
  return { event, actor }
}
