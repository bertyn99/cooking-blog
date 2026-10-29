import type { H3Event } from 'h3'
import { useEvent } from 'nitropack/runtime'
import { apiKeyHasScheduleScope, apiKeyHasScope, type ContentWriteScope } from '../../../shared/api-keys'
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

/** Planification tools — content scope plus the opt-in `schedule` scope. */
export function requireMcpScheduleTool(contentScope: ContentWriteScope): {
  event: H3Event
  actor: Actor
} {
  const { event, actor } = requireMcpTool(contentScope)
  if (!isApiKeyActor(actor) || !apiKeyHasScheduleScope(actor.apiKey.scopes, contentScope)) {
    throw createApiError(
      'FORBIDDEN',
      'Scope « schedule » requis pour cet outil (planification MCP).',
    )
  }
  return { event, actor }
}
