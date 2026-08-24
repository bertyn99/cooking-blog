import type { ImageModelV4 } from '@ai-sdk/provider'

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

/**
 * Thin ImageModelV4 adapter for Cloudflare catalog image models (nano-banana, seedream).
 * Maps AI SDK aspectRatio to CF aspect_ratio inputs.
 */
export function createCatalogImageModel(options: CatalogImageModelOptions): ImageModelV4 {
  const { binding, modelId, gateway } = options

  return {
    specificationVersion: 'v4',
    provider: 'cloudflare-catalog',
    modelId,
    maxImagesPerCall: 1,

    async doGenerate({ prompt, aspectRatio, abortSignal }) {
      const inputs: Record<string, unknown> = {
        prompt: prompt ?? '',
        aspect_ratio: aspectRatio ?? '4:3',
        output_format: 'webp',
        resolution: '1K',
      }

      const output = await binding.run(
        modelId as keyof AiModels,
        inputs,
        {
          gateway,
          signal: abortSignal,
        } as AiOptions,
      )

      const bytes = await outputToUint8Array(output)

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
