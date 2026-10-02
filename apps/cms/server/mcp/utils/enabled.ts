import type { H3Event } from 'h3'
import {
  apiKeyHasContentWriteScope,
  apiKeyHasScope,
  apiKeyHasWriteScope,
  type ContentWriteScope,
} from '../../../shared/api-keys'

/** Tool names that are reads — audited as `mcp.tool`, not via content mutations. */
export const MCP_READ_TOOL_NAMES = new Set([
  'list-articles',
  'get-article',
  'list-article-categories',
  'list-recipes',
  'get-recipe',
  'list-recipe-categories',
  'list-pages',
  'get-page',
  'list-media',
])

function flagOff(value: unknown): boolean {
  const flag = String(value ?? '').trim().toLowerCase()
  return flag === '0' || flag === 'false' || flag === 'off'
}

export function mcpKillSwitchOff(event?: H3Event): boolean {
  if (event) {
    try {
      const configured = useRuntimeConfig(event).cmsMcpEnabled
      if (configured !== undefined && configured !== null && String(configured) !== '') {
        return flagOff(configured)
      }
    }
    catch {
      // No Nitro context (unit tests) — fall through to process.env.
    }
  }
  return flagOff(process.env.CMS_MCP_ENABLED)
}

/** True when the request has a write API key with the given content scope. Used for both read and write tools. */
export function mcpContentToolEnabled(
  event: H3Event,
  contentScope?: ContentWriteScope,
): boolean {
  if (mcpKillSwitchOff(event)) return false
  const actor = event.context.actor
  if (!actor || actor.kind !== 'apiKey') return false
  if (!apiKeyHasWriteScope(actor.apiKey.scopes)) return false
  if (contentScope && !apiKeyHasContentWriteScope(actor.apiKey.scopes, contentScope)) {
    return false
  }
  return true
}

export function mcpAnyContentToolEnabled(
  event: H3Event,
  scopes: readonly ContentWriteScope[],
): boolean {
  return scopes.some(scope => mcpContentToolEnabled(event, scope))
}

export function mcpMediaListEnabled(event: H3Event): boolean {
  if (mcpKillSwitchOff(event)) return false
  const actor = event.context.actor
  if (!actor || actor.kind !== 'apiKey') return false
  return apiKeyHasWriteScope(actor.apiKey.scopes) && apiKeyHasScope(actor.apiKey.scopes, 'media')
}

export function isMcpReadToolName(name: string): boolean {
  return MCP_READ_TOOL_NAMES.has(name)
}
