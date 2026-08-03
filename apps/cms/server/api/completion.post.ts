import { createTextStreamResponse, streamText } from 'ai'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { EDITOR_COMPLETION_MODES } from '../../shared/editor-completion-modes'
import { WORKERS_AI_MODEL } from '../../shared/workers-ai-model'
import {
  buildEditorCompletionConfig,
  truncateEditorPrompt,
  type EditorCompletionMode,
} from '../services/ai/editor-completion'
import { getClientIp } from '../utils/client-ip'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { createCmsWorkersAI } from '../utils/cms-workers-ai'
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

  const workersai = createCmsWorkersAI(env.AI, {
    gatewayId,
    cacheTtl,
    metadata: {
      surface: 'editor-completion',
      mode,
      userId: session.user.id,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
    },
  })

  const result = streamText({
    model: workersai(WORKERS_AI_MODEL),
    system,
    prompt,
    maxOutputTokens,
    temperature: mode === 'continue' ? 0.35 : 0.2,
  })

  return createTextStreamResponse({ stream: result.textStream })
})
