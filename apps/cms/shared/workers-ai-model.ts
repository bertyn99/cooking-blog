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

/** Primary catalog image model (Nano Banana 2). */
export const IMAGE_MODEL_PRIMARY = 'google/nano-banana-2' as const

/** Quality A/B catalog image model. */
export const IMAGE_MODEL_ALT = 'bytedance/seedream-5-pro' as const

/** Workers AI Flux fallback when catalog models fail. */
export const IMAGE_MODEL_FALLBACK = '@cf/black-forest-labs/flux-2-klein-9b' as const

export type ImageGenerationModelId =
  | typeof IMAGE_MODEL_PRIMARY
  | typeof IMAGE_MODEL_ALT
  | typeof IMAGE_MODEL_FALLBACK

export const IMAGE_GENERATION_MODELS = [
  IMAGE_MODEL_PRIMARY,
  IMAGE_MODEL_ALT,
] as const

export type ImageAspectRatio = '1:1' | '4:3' | '16:9'

export function aspectRatioToFluxSize(aspectRatio: ImageAspectRatio): `${number}x${number}` {
  switch (aspectRatio) {
    case '1:1':
      return '1024x1024'
    case '16:9':
      return '1024x576'
    case '4:3':
    default:
      return '1024x768'
  }
}
