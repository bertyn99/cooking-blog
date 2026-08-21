import type { H3Event } from 'h3'
import {
  apiKeyHasContentWriteScope,
  apiKeyHasScope,
  apiKeyHasWriteScope,
  type ContentWriteScope,
} from '../../../shared/api-keys'

export function mcpKillSwitchOff(): boolean {
  const flag = process.env.CMS_MCP_ENABLED?.trim().toLowerCase()
  return flag === '0' || flag === 'false' || flag === 'off'
}

export function mcpWriteToolEnabled(
  event: H3Event,
  contentScope?: ContentWriteScope,
): boolean {
  if (mcpKillSwitchOff()) return false
  const actor = event.context.actor
  if (!actor || actor.kind !== 'apiKey') return false
  if (!apiKeyHasWriteScope(actor.apiKey.scopes)) return false
  if (contentScope && !apiKeyHasContentWriteScope(actor.apiKey.scopes, contentScope)) {
    return false
  }
  return true
}

export function mcpMediaListEnabled(event: H3Event): boolean {
  if (mcpKillSwitchOff()) return false
  const actor = event.context.actor
  if (!actor || actor.kind !== 'apiKey') return false
  return apiKeyHasWriteScope(actor.apiKey.scopes) && apiKeyHasScope(actor.apiKey.scopes, 'media')
}

const READ_TOOL_PREFIXES = ['list-', 'get-']

export function isMcpReadToolName(name: string): boolean {
  return READ_TOOL_PREFIXES.some(prefix => name.startsWith(prefix))
}
