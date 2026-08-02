import { createTextStreamResponse, streamText } from 'ai'
import { z } from 'zod'
import { WORKERS_AI_MODEL } from '../../shared/workers-ai-model'
import {
  buildEditorCompletionConfig,
  truncateEditorPrompt,
  type EditorCompletionMode,
} from '../services/ai/editor-completion'
import { createApiError } from '../utils/errors'
import { requireEditor } from '../utils/http-auth'
import { getCloudflareEnv } from '../utils/cloudflare-env'
import { createCmsWorkersAI } from '../utils/cms-workers-ai'

const completionBodySchema = z.object({
  prompt: z.string().min(1).max(20_000),
  mode: z.enum([
    'continue',
    'fix',
    'extend',
    'reduce',
    'simplify',
    'summarize',
    'translate',
  ]).optional(),
  language: z.string().max(64).optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const body = await readBody(event)
  const parsed = completionBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid completion payload', parsed.error.flatten())
  }

  const env = getCloudflareEnv(event)
  if (!env?.AI) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Workers AI is not configured. Deploy via Alchemy or enable the local AI binding.',
    })
  }

  const mode = (parsed.data.mode ?? 'continue') as EditorCompletionMode
  const { system, maxOutputTokens } = buildEditorCompletionConfig(mode, parsed.data.language)
  const prompt = truncateEditorPrompt(parsed.data.prompt)

  const runtimeConfig = useRuntimeConfig(event)
  const workersai = createCmsWorkersAI(
    env.AI,
    env.CMS_AI_GATEWAY_ID ?? runtimeConfig.cmsAiGatewayId,
  )
  const result = streamText({
    model: workersai(WORKERS_AI_MODEL),
    system,
    prompt,
    maxOutputTokens,
    temperature: mode === 'continue' ? 0.35 : 0.2,
  })

  return createTextStreamResponse({ stream: result.textStream })
})
