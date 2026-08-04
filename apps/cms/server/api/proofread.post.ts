import { z } from 'zod'
import { runEditorProofread } from '../services/ai/editor-proofread'
import { getClientIp } from '../utils/client-ip'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { createApiError } from '../utils/errors'
import { requireEditor } from '../utils/http-auth'
import { useKvStore } from '../utils/kv'
import { createRequestRateLimiter } from '../utils/rate-limit'

const LIMIT = {
  prefix: 'proofread',
  maxRequests: 30,
  windowSeconds: 60,
} as const

const bodySchema = z.object({
  text: z.string().min(1).max(12_000),
})

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const ip = getClientIp(event)
  const rate = await createRequestRateLimiter(useKvStore(event), LIMIT)
    .consume(`${session.user.id}:${ip}`)
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop de requêtes d’orthographe. Réessayez dans une minute.',
      { retryAfterSeconds: LIMIT.windowSeconds },
    )
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Texte invalide.', parsed.error.flatten())
  }

  const env = getCloudflareEnv(event)
  if (!env?.AI) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Workers AI n’est pas configuré.',
    })
  }

  const gatewayId = import.meta.dev
    ? null
    : (env.CMS_AI_GATEWAY_ID
      || (typeof useRuntimeConfig(event).cmsAiGatewayId === 'string'
        ? useRuntimeConfig(event).cmsAiGatewayId as string
        : null))

  try {
    const corrections = await runEditorProofread({
      ai: env.AI,
      text: parsed.data.text,
      gatewayId,
      userId: session.user.id,
    })
    return { corrections }
  }
  catch (error) {
    console.error('[proofread] failed', error)
    throw createError({
      statusCode: 502,
      message: 'Échec de l’analyse orthographique.',
      cause: error,
    })
  }
})
