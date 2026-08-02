import { createWorkersAI } from 'workers-ai-provider'
import { CMS_AI_GATEWAY_ID } from '../../shared/workers-ai-model'

/**
 * Workers AI provider for CMS — always routes through Cloudflare AI Gateway
 * (Alchemy `Cloudflare.AI.Gateway`, id `jdc-cms-ai`).
 */
export function createCmsWorkersAI(ai: Ai, gatewayId = CMS_AI_GATEWAY_ID) {
  return createWorkersAI({
    binding: ai,
    gateway: {
      id: gatewayId,
    },
  })
}
