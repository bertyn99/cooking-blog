import type { ImageModelV4 } from '@ai-sdk/provider'
import { IMAGE_MODEL_ALT, IMAGE_MODEL_PRIMARY } from '../../../shared/workers-ai-model'

interface CatalogGatewayOptions {
  id: string
  metadata?: Record<string, string | number | boolean | null>
  cacheTtl?: number
  skipCache?: boolean
}

export interface CatalogImageModelOptions {
  binding: Ai
  modelId: string
  gateway?: CatalogGatewayOptions
}

/**
 * Google AI Studio id for Cloudflare catalog `google/nano-banana-2`
 * (Gemini 3.1 Flash Image / Nano Banana 2).
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
export const GOOGLE_NANO_BANANA_2_STUDIO_MODEL = 'gemini-3.1-flash-image' as const

type CatalogImageModelId = typeof IMAGE_MODEL_PRIMARY | typeof IMAGE_MODEL_ALT

function isCatalogImageModelId(modelId: string): modelId is CatalogImageModelId {
  return modelId === IMAGE_MODEL_PRIMARY || modelId === IMAGE_MODEL_ALT
}

export function buildCatalogGatewayRequest(
  modelId: CatalogImageModelId,
  prompt: string,
  aspectRatio: string,
): AIGatewayUniversalRequest {
  switch (modelId) {
    case IMAGE_MODEL_PRIMARY:
      return {
        provider: 'google-ai-studio',
        endpoint: `v1/models/${GOOGLE_NANO_BANANA_2_STUDIO_MODEL}:generateContent`,
        headers: {
          'content-type': 'application/json',
        },
        query: {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio },
          },
        },
      }
    case IMAGE_MODEL_ALT:
      return {
        provider: 'workers-ai',
        endpoint: IMAGE_MODEL_ALT,
        headers: {
          'content-type': 'application/json',
        },
        query: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: 'png',
          resolution: '1K',
        },
      }
    default: {
      const _exhaustive: never = modelId
      throw new Error(`Unsupported catalog image model: ${String(_exhaustive)}`)
    }
  }
}

function inlineImageData(part: Record<string, unknown> | undefined): string | undefined {
  if (!part) {
    return undefined
  }
  const inline = (part.inlineData ?? part.inline_data) as { data?: unknown } | undefined
  return typeof inline?.data === 'string' ? inline.data : undefined
}

export function unwrapGatewayImageJson(json: unknown): unknown {
  if (typeof json !== 'object' || json === null) {
    return json
  }
  const obj = json as Record<string, unknown>
  const candidates = obj.candidates
  if (Array.isArray(candidates)) {
    const parts = (candidates[0] as { content?: { parts?: Array<Record<string, unknown>> } } | undefined)
      ?.content?.parts
    if (Array.isArray(parts)) {
      for (const part of parts) {
        const data = inlineImageData(part)
        if (data) {
          return { image: data }
        }
      }
    }
  }
  return json
}

async function outputToUint8Array(output: unknown): Promise<Uint8Array> {
  if (output instanceof Uint8Array) {
    return output
  }
  if (output instanceof ArrayBuffer) {
    return new Uint8Array(output)
  }
  if (output instanceof ReadableStream) {
    const reader = (output as ReadableStream<Uint8Array>).getReader()
    const chunks: Uint8Array[] = []
    let totalLength = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalLength += value.length
    }
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }
  if (output instanceof Response) {
    return new Uint8Array(await output.arrayBuffer())
  }
  if (typeof output === 'object' && output !== null) {
    const obj = output as Record<string, unknown>
    if (typeof obj.image === 'string') {
      if (obj.image.startsWith('http://') || obj.image.startsWith('https://')) {
        const response = await fetch(obj.image)
        if (!response.ok) {
          throw new Error('Failed to fetch generated image URL')
        }
        return new Uint8Array(await response.arrayBuffer())
      }
      return Uint8Array.from(atob(obj.image), c => c.charCodeAt(0))
    }
    const nested = obj.result as Record<string, unknown> | undefined
    if (nested && typeof nested.image === 'string') {
      if (nested.image.startsWith('http://') || nested.image.startsWith('https://')) {
        const response = await fetch(nested.image)
        if (!response.ok) {
          throw new Error('Failed to fetch generated image URL')
        }
        return new Uint8Array(await response.arrayBuffer())
      }
      return Uint8Array.from(atob(nested.image), c => c.charCodeAt(0))
    }
    if (obj.data instanceof Uint8Array) {
      return obj.data
    }
    if (obj.data instanceof ArrayBuffer) {
      return new Uint8Array(obj.data)
    }
    if (typeof obj.arrayBuffer === 'function') {
      return new Uint8Array(await (obj as unknown as Response).arrayBuffer())
    }
  }
  throw new Error('Unexpected output type from catalog image model')
}

async function bytesFromGatewayResponse(response: Response): Promise<Uint8Array> {
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`AI Gateway ${response.status}: ${body.slice(0, 300)}`)
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('image/')) {
    return new Uint8Array(await response.arrayBuffer())
  }
  const json: unknown = await response.json()
  return outputToUint8Array(unwrapGatewayImageJson(json))
}

/**
 * ImageModelV4 adapter for catalog image models.
 *
 * Catalog ids (`google/nano-banana-2`) are not in the Workers AI `AiModels`
 * registry. Calling `binding.run(model as keyof AiModels)` looks the schema
 * up and throws `Cannot set properties of undefined (setting '#options')`.
 *
 * Alchemy / Cloudflare gateway binding: `env.AI.gateway(id).run({ provider, endpoint, query })`.
 * Worker bindings are pre-authenticated; BYOK injects the Google AI Studio key.
 * @see https://alchemy.run/providers/cloudflare/ai/querygateway
 * @see https://developers.cloudflare.com/ai-gateway/usage/universal/
 */
export function createCatalogImageModel(options: CatalogImageModelOptions): ImageModelV4 {
  const { binding, modelId, gateway } = options

  return {
    specificationVersion: 'v4',
    provider: 'cloudflare-catalog',
    modelId,
    maxImagesPerCall: 1,

    async doGenerate({ prompt, aspectRatio, abortSignal }) {
      const text = typeof prompt === 'string' ? prompt : ''
      const ratio = aspectRatio ?? '4:3'

      if (!gateway?.id) {
        throw new Error('AI Gateway id is required for catalog image models')
      }
      if (!isCatalogImageModelId(modelId)) {
        throw new Error(`Unsupported catalog image model: ${modelId}`)
      }

      const request = buildCatalogGatewayRequest(modelId, text, ratio)
      const response = await binding.gateway(gateway.id).run(request, {
        signal: abortSignal,
        gateway: {
          ...(gateway.metadata ? { metadata: gateway.metadata } : {}),
          ...(gateway.cacheTtl != null ? { cacheTtl: gateway.cacheTtl } : {}),
          ...(gateway.skipCache != null ? { skipCache: gateway.skipCache } : {}),
        },
      })

      const bytes = await bytesFromGatewayResponse(response)

      return {
        images: [bytes],
        response: {
          headers: {},
          modelId,
          timestamp: new Date(),
        },
        warnings: [],
      }
    },
  }
}
