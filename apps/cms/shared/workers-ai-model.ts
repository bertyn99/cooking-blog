/**
 * Default Workers AI model for CMS LLM features (generation + editor completion).
 * @see https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
 */
export const WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it' as const

/**
 * Cloudflare AI Gateway id — must match Alchemy `Cloudflare.AI.Gateway` in `infra/workers.ts`.
 * @see https://developers.cloudflare.com/ai-gateway/
 */
export const CMS_AI_GATEWAY_ID = 'jdc-cms-ai' as const
