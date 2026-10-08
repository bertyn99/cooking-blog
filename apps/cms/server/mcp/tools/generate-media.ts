import { z } from 'zod'
import { resolveMediaGenerationGatewayId } from '../../utils/media-generation-gateway'
import { requireMcpMediaTool } from '../utils/actor'
import { mcpMediaListEnabled } from '../utils/enabled'
import { MCP_CREATE } from '../utils/payload'
import { generateMediaImage } from '../../services/ai/image-generation'
import { ingestImageBuffer } from '../../utils/ingest-image-buffer'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import { createRequestRateLimiter } from '../../utils/rate-limit'
import { useKvStore } from '../../utils/kv'
import {
  IMAGE_GENERATION_MODELS,
  type ImageAspectRatio,
  type ImageGenerationModelId,
} from '../../../shared/workers-ai-model'

const MEDIA_GENERATE_LIMIT = {
  prefix: 'media-generate',
  maxRequests: 15,
  windowSeconds: 60,
} as const

export default defineMcpTool({
  description: `Generate an image with Workers AI (google/nano-banana-2 by default, bytedance/seedream-5-pro selectable, automatic flux fallback) and store it in the media library. Use when list-media has no adequate image AND stock search (search-stock-media) has no good match — prefer real photos for classic dishes. Returns pathname — use in markdown ![alt](/uploads/<pathname>) or as coverBlobPathname. Rate limited: 15/min.`,
  annotations: MCP_CREATE,
  inputSchema: {
    prompt: z.string().trim().min(1).max(2000).describe(
      'Image prompt. Describe the dish, angle, surface, light. English prompts work best. Example: "Overhead shot of Moroccan ghriba cookies on a brass tray, mint tea glass beside, warm natural light, food photography"',
    ),
    aspectRatio: z.enum(['1:1', '4:3', '16:9']).default('4:3').describe('Site images render 4:3 by default'),
    model: z.enum([...IMAGE_GENERATION_MODELS] as [string, ...string[]]).optional()
      .describe('Omit for the default (nano-banana-2)'),
  },
  enabled: event => mcpMediaListEnabled(event) && Boolean(getCloudflareEnv(event)?.AI),
  handler: async ({ prompt, aspectRatio, model }) => {
    const { event, actor } = requireMcpMediaTool()

    const limiter = createRequestRateLimiter(useKvStore(event), MEDIA_GENERATE_LIMIT)
    const rate = await limiter.consume(`key:${actor.apiKey.id}`)
    if (!rate.allowed) {
      throw createError({
        statusCode: 429,
        message: `Trop de générations (${MEDIA_GENERATE_LIMIT.maxRequests}/min). Réessayez dans quelques instants.`,
      })
    }

    const generated = await generateMediaImage(event, {
      prompt,
      aspectRatio: aspectRatio as ImageAspectRatio,
      model: model as ImageGenerationModelId | undefined,
      gatewayId: resolveMediaGenerationGatewayId(event),
      metadata: {
        surface: 'mcp-media-generate',
        apiKeyId: actor.apiKey.id,
      },
    })

    const ingested = await ingestImageBuffer(event, {
      buffer: generated.buffer,
      contentType: generated.contentType,
      originalName: `ai-${Date.now()}.webp`,
      altText: prompt.slice(0, 125),
      source: 'ai',
      aiPrompt: prompt,
    })

    return {
      ...ingested,
      modelId: generated.modelId,
      usedFallback: generated.usedFallback,
    }
  },
})
