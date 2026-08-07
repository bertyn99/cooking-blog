import { generateText, streamText } from 'ai'
import { Readable } from 'node:stream'
import type { H3Event } from 'h3'
import { useLogger } from 'evlog'
import { z } from 'zod'
import { EDITOR_COMPLETION_MODES } from '../../shared/editor-completion-modes'
import {
  buildEditorCompletionConfig,
  truncateEditorPrompt,
  type EditorCompletionMode,
} from '../services/ai/editor-completion'
import { getClientIp } from '../utils/client-ip'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { createCmsWorkersAI } from '../utils/cms-workers-ai'
import {
  isCreativeEditorCompletionMode,
  resolveEditorCompletionModelId,
  resolveVisibleCompletionText,
} from '../utils/editor-completion-output'
import { createApiError } from '../utils/errors'
import { requireEditor } from '../utils/http-auth'
import { useKvStore } from '../utils/kv'
import { toLogError } from '../utils/logging'
import { createRequestRateLimiter } from '../utils/rate-limit'

const COMPLETION_LIMIT = {
  prefix: 'completion',
  maxRequests: 30,
  windowSeconds: 60,
} as const

const completionBodySchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum(EDITOR_COMPLETION_MODES).optional(),
  language: z.string().max(64).optional(),
})

function getCompletionLimiter(event: H3Event) {
  return createRequestRateLimiter(useKvStore(event), COMPLETION_LIMIT)
}

/**
 * Prefer Alchemy-bound gateway id. In local Nuxt without that binding, skip the
 * gateway so Workers AI still works against the raw AI binding.
 */
function resolveCompletionGatewayId(event: H3Event, envGatewayId?: string): string | null {
  if (envGatewayId) {
    return envGatewayId
  }
  if (import.meta.dev) {
    return null
  }
  const fromConfig = useRuntimeConfig(event).cmsAiGatewayId
  return typeof fromConfig === 'string' && fromConfig.length > 0 ? fromConfig : null
}

/**
 * Workers AI + Nitro: `createTextStreamResponse(Web Response)` often yields an
 * empty body under the Node Cloudflare-dev proxy. Pipe the async text stream
 * through a Node Readable instead (same client protocol: plain text chunks).
 */
function sendPlainTextCompletionStream(event: H3Event, textStream: AsyncIterable<string>) {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  return sendStream(event, Readable.from(textStream))
}

/**
 * Stream visible text for TipTap. Reasoning deltas stay server-side; if the
 * model never emits content tokens, fall back once to recovered answer text.
 */
async function* streamVisibleEditorText(
  result: ReturnType<typeof streamText>
): AsyncGenerator<string> {
  let emitted = false
  for await (const chunk of result.textStream) {
    if (chunk) {
      emitted = true
      yield chunk
    }
  }

  if (emitted) {
    return
  }

  const [text, reasoningText] = await Promise.all([result.text, result.reasoningText])
  const visible = resolveVisibleCompletionText({ text, reasoningText })
  if (visible) {
    yield visible
  }
}

export default defineEventHandler(async (event) => {
  const log = useLogger(event as Parameters<typeof useLogger>[0])
  const session = await requireEditor(event)

  const ip = getClientIp(event)
  const rateKey = `${session.user.id}:${ip}`
  const rate = await getCompletionLimiter(event).consume(rateKey)
  if (!rate.allowed) {
    log.warn('Editor completion rate limit exceeded', {
      completion: {
        userId: session.user.id,
        retryAfterSeconds: COMPLETION_LIMIT.windowSeconds,
      },
    })
    throw createApiError(
      'FORBIDDEN',
      'Trop de requêtes d’assistance IA. Réessayez dans une minute.',
      { retryAfterSeconds: COMPLETION_LIMIT.windowSeconds }
    )
  }

  const body = await readBody(event)
  const parsed = completionBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Requête d’assistance IA invalide.',
      parsed.error.flatten()
    )
  }

  const env = getCloudflareEnv(event)
  if (!env?.AI) {
    const cause = new Error('Workers AI binding is missing')
    log.error(cause, {
      completion: {
        step: 'resolve-binding',
        userId: session.user.id,
      },
    })
    throw createApiError('INTERNAL_ERROR', 'Workers AI n’est pas configuré.', undefined, {
      status: 503,
      why: 'Le binding Workers AI est absent de cet environnement.',
      fix: 'Déployez via Alchemy ou activez le binding AI local.',
      cause,
      internal: { binding: 'AI' },
    })
  }

  const mode = (parsed.data.mode ?? 'continue') as EditorCompletionMode
  const { system, maxOutputTokens, cacheTtl } = buildEditorCompletionConfig(
    mode,
    parsed.data.language
  )
  const prompt = truncateEditorPrompt(parsed.data.prompt)
  const gatewayId = resolveCompletionGatewayId(event, env.CMS_AI_GATEWAY_ID)
  const modelId = resolveEditorCompletionModelId(mode)
  const creative = isCreativeEditorCompletionMode(mode)

  log.set({
    completion: {
      mode,
      model: modelId,
      userId: session.user.id,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
    },
  })

  const workersai = createCmsWorkersAI(env.AI, {
    gatewayId,
    cacheTtl,
    metadata: {
      surface: 'editor-completion',
      mode,
      model: modelId,
      userId: session.user.id,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
    },
  })

  const model = workersai(modelId)
  // Continuer / Développer: keep Gemma reasoning (low effort) — TipTap only
  // receives visible `text` (with reasoning fallback if content is empty).
  // Mechanical transforms: disable reasoning on the instruct model.
  const shared = {
    model,
    system,
    prompt,
    maxOutputTokens,
    temperature: mode === 'continue' ? 0.35 : 0.2,
    ...(creative
      ? {
          reasoning: 'low' as const,
          providerOptions: {
            'workers-ai': {
              reasoning_effort: 'low' as const,
            },
          },
        }
      : {
          reasoning: 'none' as const,
          providerOptions: {
            'workers-ai': {
              reasoning_effort: null,
            },
          },
        }),
  }

  // Local Cloudflare-dev AI proxy: streaming often returns an empty body even
  // when generateText works. Prefer a buffered response in dev; stream in prod.
  if (import.meta.dev) {
    try {
      const generated = await generateText(shared)
      const visible = resolveVisibleCompletionText({
        text: generated.text,
        reasoningText: generated.reasoningText,
      })
      if (!visible) {
        const cause = new Error('Workers AI returned an empty response')
        log.error(cause, {
          completion: {
            step: 'generate-text',
            finishReason: generated.finishReason,
            outputLength: generated.text?.length ?? 0,
            reasoningLength: generated.reasoningText?.length ?? 0,
          },
        })
        throw createApiError(
          'INTERNAL_ERROR',
          'Workers AI a renvoyé une réponse vide.',
          undefined,
          {
            status: 502,
            why: 'Le modèle n’a produit aucun contenu exploitable.',
            fix: 'Réessayez la génération ou choisissez un autre mode.',
            cause,
            internal: { model: modelId, mode },
          }
        )
      }
      log.set({
        completion: {
          status: 'success',
          finishReason: generated.finishReason,
          outputLength: visible.length,
        },
      })
      setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
      return visible
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      log.error(toLogError(error), {
        completion: { step: 'generate-text' },
      })
      throw createApiError('INTERNAL_ERROR', 'Échec de génération Workers AI.', undefined, {
        status: 502,
        why: 'Le service Workers AI n’a pas pu générer le texte.',
        fix: 'Réessayez dans quelques instants.',
        cause: error instanceof Error ? error : undefined,
        internal: { model: modelId, mode },
      })
    }
  }

  const result = streamText({
    ...shared,
    onError: ({ error }) => {
      log.error(toLogError(error), {
        completion: {
          step: 'stream-text',
          model: modelId,
          mode,
        },
      })
    },
  })

  return sendPlainTextCompletionStream(event, streamVisibleEditorText(result))
})
