import { z } from 'zod'
import {
  IMAGE_GENERATION_MODELS,
  type ImageAspectRatio,
  type ImageGenerationModelId,
} from '../../../shared/workers-ai-model'
import { generateMediaImage } from '../../services/ai/image-generation'
import { getClientIp } from '../../utils/client-ip'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import { createApiError } from '../../utils/errors'
import { requireEditor } from '../../utils/http-auth'
import { ingestImageBuffer } from '../../utils/ingest-image-buffer'
import { useKvStore } from '../../utils/kv'
import { createRequestRateLimiter } from '../../utils/rate-limit'
import { isAbortError, resolveRequestAbortSignal } from '../../utils/request-abort'

const MEDIA_GENERATE_LIMIT = {
  prefix: 'media-generate',
  maxRequests: 15,
  windowSeconds: 60,
} as const

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(2_000),
  aspectRatio: z.enum(['1:1', '4:3', '16:9']).optional(),
  model: z.enum([...IMAGE_GENERATION_MODELS] as [string, ...string[]]).optional(),
})

function getMediaGenerateLimiter(event: Parameters<typeof useKvStore>[0]) {
  return createRequestRateLimiter(useKvStore(event), MEDIA_GENERATE_LIMIT)
}

function resolveGenerationGatewayId(event: Parameters<typeof getCloudflareEnv>[0]): string | null {
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

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Corps de requête invalide.', parsed.error.flatten())
  }

  const limiter = getMediaGenerateLimiter(event)
  const rateKey = `${session.user.id}:${getClientIp(event)}`
  const rate = await limiter.consume(rateKey)
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop de générations. Réessayez dans quelques instants.',
      { retryAfterSeconds: MEDIA_GENERATE_LIMIT.windowSeconds },
    )
  }

  const abortSignal = resolveRequestAbortSignal(event)

  const { prompt, aspectRatio, model } = parsed.data
  const gatewayId = resolveGenerationGatewayId(event)

  let generated
  try {
    generated = await generateMediaImage(event, {
      prompt,
      aspectRatio: (aspectRatio ?? '4:3') as ImageAspectRatio,
      model: model as ImageGenerationModelId | undefined,
      gatewayId,
      metadata: {
        surface: 'media-generate',
        userId: session.user.id,
      },
      abortSignal,
    })
  }
  catch (error: unknown) {
    if (isAbortError(error) || abortSignal.aborted) {
      throw createApiError('FORBIDDEN', 'Génération annulée.')
    }
    throw error
  }

  if (abortSignal.aborted) {
    throw createApiError('FORBIDDEN', 'Génération annulée.')
  }

  const ingested = await ingestImageBuffer(event, {
    buffer: generated.buffer,
    contentType: generated.contentType,
    originalName: `ai-${Date.now()}.webp`,
    altText: prompt.slice(0, 125),
    source: 'ai',
    aiPrompt: prompt,
  })

  setResponseStatus(event, 201)
  return {
    ...ingested,
    modelId: generated.modelId,
    usedFallback: generated.usedFallback,
  }
})
