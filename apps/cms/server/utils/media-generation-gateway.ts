import type { H3Event } from 'h3'
import { getCloudflareEnv } from './cloudflare-env'

/**
 * AI Gateway id for media/content generation calls.
 * Prefers the worker binding, falls back to runtime config; `null` in dev when
 * `jdc-cms-ai` is not provisioned (direct Workers AI call, no gateway).
 */
export function resolveMediaGenerationGatewayId(event: H3Event): string | null {
  const env = getCloudflareEnv(event)
  if (env?.CMS_AI_GATEWAY_ID) {
    return env.CMS_AI_GATEWAY_ID
  }
  if (import.meta.dev) {
    return null
  }
  const fromConfig = useRuntimeConfig(event).cmsAiGatewayId
  return typeof fromConfig === 'string' && fromConfig.length > 0 ? fromConfig : null
}
