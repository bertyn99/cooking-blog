import { generateImage } from 'ai'
import type { H3Event } from 'nitro/h3'
import {
  aspectRatioToFluxSize,
  IMAGE_MODEL_ALT,
  IMAGE_MODEL_FALLBACK,
  IMAGE_MODEL_PRIMARY,
  type ImageAspectRatio,
  type ImageGenerationModelId,
} from '../../../shared/workers-ai-model'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import { createCmsWorkersAI } from '../../utils/cms-workers-ai'
import { createApiError } from '../../utils/errors'
import { createCatalogImageModel } from './catalog-image-model'
import { isAbortError } from '../../utils/request-abort'

export interface GenerateMediaImageOptions {
  prompt: string
  aspectRatio?: ImageAspectRatio
  model?: ImageGenerationModelId
  gatewayId?: string | null
  metadata?: Record<string, string | number | boolean | null>
  abortSignal?: AbortSignal
}

export interface GenerateMediaImageResult {
  buffer: Uint8Array
  contentType: string
  modelId: string
  usedFallback: boolean
}

function resolveCatalogModel(model?: ImageGenerationModelId): string {
  if (model === IMAGE_MODEL_ALT) {
    return IMAGE_MODEL_ALT
  }
  if (model === IMAGE_MODEL_FALLBACK) {
    return IMAGE_MODEL_PRIMARY
  }
  return IMAGE_MODEL_PRIMARY
}

function contentTypeFromBytes(bytes: Uint8Array): string {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif'
  if (bytes.length > 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp'
  }
  return 'image/webp'
}

export async function generateMediaImage(
  event: H3Event,
  options: GenerateMediaImageOptions,
): Promise<GenerateMediaImageResult> {
  const env = getCloudflareEnv(event)
  const ai = env?.AI
  if (!ai) {
    throw createApiError('INTERNAL_ERROR', 'Workers AI indisponible sur cet environnement.')
  }

  const prompt = options.prompt.trim()
  if (!prompt) {
    throw createApiError('VALIDATION_ERROR', 'Le prompt est requis.')
  }

  const aspectRatio = options.aspectRatio ?? '4:3'
  const gatewayId = options.gatewayId
  const catalogModelId = resolveCatalogModel(options.model)

  const gatewayOptions = gatewayId
    ? { id: gatewayId, ...(options.metadata ? { metadata: options.metadata } : {}) }
    : undefined

  try {
    const catalogModel = createCatalogImageModel({
      binding: ai,
      modelId: catalogModelId,
      gateway: gatewayOptions,
    })

    const generated = await generateImage({
      model: catalogModel,
      prompt,
      aspectRatio,
      abortSignal: options.abortSignal,
    })

    const image = generated.image ?? generated.images?.[0]
    if (!image?.uint8Array?.byteLength) {
      throw new Error('Empty catalog image response')
    }

    return {
      buffer: image.uint8Array,
      contentType: image.mediaType ?? contentTypeFromBytes(image.uint8Array),
      modelId: catalogModelId,
      usedFallback: false,
    }
  }
  catch (catalogError) {
    if (isAbortError(catalogError) || options.abortSignal?.aborted) {
      throw catalogError
    }

    const workersai = createCmsWorkersAI(ai, {
      gatewayId,
      metadata: options.metadata,
    })

    const flux = await generateImage({
      model: workersai.image(IMAGE_MODEL_FALLBACK),
      prompt,
      size: aspectRatioToFluxSize(aspectRatio),
      abortSignal: options.abortSignal,
    })

    if (options.abortSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const image = flux.image ?? flux.images?.[0]
    if (!image?.uint8Array?.byteLength) {
      throw catalogError instanceof Error ? catalogError : new Error('Image generation failed')
    }

    return {
      buffer: image.uint8Array,
      contentType: image.mediaType ?? contentTypeFromBytes(image.uint8Array),
      modelId: IMAGE_MODEL_FALLBACK,
      usedFallback: true,
    }
  }
}
