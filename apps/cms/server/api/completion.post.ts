import { generateText, streamText } from 'ai'
import { Readable } from 'node:stream'
import type { H3Event } from 'h3'
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
  result: ReturnType<typeof streamText>,
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

  const [text, reasoningText] = await Promise.all([
    result.text,
    result.reasoningText,
  ])
  const visible = resolveVisibleCompletionText({ text, reasoningText })
  if (visible) {
    yield visible
  }
}

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const ip = getClientIp(event)
  const rateKey = `${session.user.id}:${ip}`
  const rate = await getCompletionLimiter(event).consume(rateKey)
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop de requêtes d’assistance IA. Réessayez dans une minute.',
      { retryAfterSeconds: COMPLETION_LIMIT.windowSeconds },
    )
  }

  const body = await readBody(event)
  const parsed = completionBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Requête d’assistance IA invalide.',
      parsed.error.flatten(),
    )
  }

  const env = getCloudflareEnv(event)
  if (!env?.AI) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Workers AI n’est pas configuré. Déployez via Alchemy ou activez le binding AI local.',
    })
  }

  const mode = (parsed.data.mode ?? 'continue') as EditorCompletionMode
  const { system, maxOutputTokens, cacheTtl } = buildEditorCompletionConfig(
    mode,
    parsed.data.language,
  )
  const prompt = truncateEditorPrompt(parsed.data.prompt)
  const gatewayId = resolveCompletionGatewayId(event, env.CMS_AI_GATEWAY_ID)
  const modelId = resolveEditorCompletionModelId(mode)
  const creative = isCreativeEditorCompletionMode(mode)

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
        console.error('[completion] empty Workers AI response', {
          model: modelId,
          mode,
          finishReason: generated.finishReason,
          usage: generated.usage,
          textLen: generated.text?.length ?? 0,
          reasoningLen: generated.reasoningText?.length ?? 0,
        })
        throw createError({
          statusCode: 502,
          message: 'Workers AI a renvoyé une réponse vide.',
        })
      }
      setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
      return visible
    }
    catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      console.error('[completion] generateText failed', error)
      throw createError({
        statusCode: 502,
        message: 'Échec de génération Workers AI.',
        cause: error,
      })
    }
  }

  const result = streamText({
    ...shared,
    onError: ({ error }) => {
      console.error('[completion] streamText error', error)
    },
  })

  return sendPlainTextCompletionStream(event, streamVisibleEditorText(result))
})
