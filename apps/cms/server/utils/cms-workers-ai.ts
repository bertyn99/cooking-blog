import { createWorkersAI } from 'workers-ai-provider'
import { CMS_AI_GATEWAY_ID } from '../../shared/workers-ai-model'

export interface CreateCmsWorkersAIOptions {
  /**
   * AI Gateway id. Pass `null` or `''` to call Workers AI without a gateway
   * (local/dev when `jdc-cms-ai` is not provisioned yet).
   * Omit / `undefined` to use {@link CMS_AI_GATEWAY_ID}.
   */
  gatewayId?: string | null
  /** Attached to AI Gateway logs for spend attribution. */
  metadata?: Record<string, string | number | boolean | null>
  /** Gateway response cache TTL in seconds. */
  cacheTtl?: number
}

function resolveGatewayId(gatewayId: string | null | undefined): string | undefined {
  if (gatewayId === null || gatewayId === '') {
    return undefined
  }
  if (gatewayId === undefined) {
    return CMS_AI_GATEWAY_ID
  }
  return gatewayId
}

/**
 * Workers AI provider for CMS — routes through Cloudflare AI Gateway when an id is set
 * (Alchemy `Cloudflare.AI.Gateway`, id `jdc-cms-ai`).
 */
export function createCmsWorkersAI(ai: Ai, options: CreateCmsWorkersAIOptions = {}) {
  const gatewayId = resolveGatewayId(options.gatewayId)

  if (!gatewayId) {
    return createWorkersAI({ binding: ai })
  }

  return createWorkersAI({
    binding: ai,
    gateway: {
      id: gatewayId,
      ...(options.metadata ? { metadata: options.metadata } : {}),
      ...(options.cacheTtl != null ? { cacheTtl: options.cacheTtl } : {}),
    },
  })
}
