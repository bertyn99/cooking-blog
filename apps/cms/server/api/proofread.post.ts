import { useLogger } from 'evlog'
import { z } from 'zod'
import { runEditorProofread } from '../services/ai/editor-proofread'
import { getClientIp } from '../utils/client-ip'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { createApiError } from '../utils/errors'
import { requireEditor } from '../utils/http-auth'
import { useKvStore } from '../utils/kv'
import { toLogError } from '../utils/logging'
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
  const log = useLogger(event as Parameters<typeof useLogger>[0])
  const session = await requireEditor(event)
  const ip = getClientIp(event)
  const rate = await createRequestRateLimiter(useKvStore(event), LIMIT).consume(
    `${session.user.id}:${ip}`
  )
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop de requêtes d’orthographe. Réessayez dans une minute.',
      { retryAfterSeconds: LIMIT.windowSeconds }
    )
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Texte invalide.', parsed.error.flatten())
  }

  const env = getCloudflareEnv(event)
  if (!env?.AI) {
    const cause = new Error('Workers AI binding is missing')
    log.error(cause, {
      proofread: {
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

  const gatewayId = import.meta.dev
    ? null
    : env.CMS_AI_GATEWAY_ID ||
      (typeof useRuntimeConfig(event).cmsAiGatewayId === 'string'
        ? (useRuntimeConfig(event).cmsAiGatewayId as string)
        : null)

  log.set({
    proofread: {
      userId: session.user.id,
      inputLength: parsed.data.text.length,
      provider: 'workers-ai',
    },
  })

  try {
    const corrections = await runEditorProofread({
      ai: env.AI,
      text: parsed.data.text,
      gatewayId,
      userId: String(session.user.id),
    })
    return { corrections }
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(toLogError(error)))
    log.error(cause, {
      proofread: {
        step: 'run-editor-proofread',
        inputLength: parsed.data.text.length,
      },
    })
    throw createApiError('INTERNAL_ERROR', 'Échec de l’analyse orthographique.', undefined, {
      status: 502,
      why: 'Le service Workers AI n’a pas pu analyser le texte.',
      fix: 'Réessayez dans quelques instants.',
      cause,
    })
  }
})
