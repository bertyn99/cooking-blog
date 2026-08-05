/**
 * Default Workers AI model for long-form generation + creative editor modes
 * (Continuer / Développer). Reasoning-capable — callers must prefer `text`
 * and fall back via `resolveVisibleCompletionText` when content is empty.
 * @see https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/
 */
export const WORKERS_AI_MODEL = '@cf/google/gemma-4-26b-a4b-it' as const

/**
 * Mechanical editor transforms (Orthographe, Raccourcir, Simplifier, …) —
 * non-reasoning instruct model for fast, deterministic plain-text replacements.
 * @see https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/
 */
export const EDITOR_COMPLETION_MODEL = '@cf/meta/llama-3.2-3b-instruct' as const

/**
 * Cloudflare AI Gateway id — must match Alchemy `Cloudflare.AI.Gateway` in `infra/workers.ts`.
 * @see https://developers.cloudflare.com/ai-gateway/
 */
export const CMS_AI_GATEWAY_ID = 'jdc-cms-ai' as const
