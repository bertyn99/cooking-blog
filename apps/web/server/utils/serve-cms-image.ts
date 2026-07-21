import type { H3Event } from 'h3'
import { hasImageTransformOps, parseCmsImagePath } from './parse-cms-image-path'

const LONG_CACHE = 'public, max-age=31536000, stale-while-revalidate=604800'

interface WebCloudflareEnv {
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: Record<string, unknown>): Promise<{ response(): Promise<Response> }>
      }
    }
  }
}

function mapTransformOptions(operations: Record<string, string>) {
  const transform: Record<string, unknown> = {}
  if (operations.width) {
    transform.width = Number.parseInt(operations.width, 10)
  }
  if (operations.height) {
    transform.height = Number.parseInt(operations.height, 10)
  }
  if (operations.fit) {
    transform.fit = operations.fit === 'cover' ? 'cover' : 'scale-down'
  }
  return transform
}

function mapOutputOptions(operations: Record<string, string>) {
  const format = operations.format === 'webp'
    ? 'image/webp'
    : operations.format === 'avif'
      ? 'image/avif'
      : operations.format === 'png'
        ? 'image/png'
        : operations.format === 'jpeg'
          ? 'image/jpeg'
          : 'image/webp'
  const quality = operations.quality
    ? Number.parseInt(operations.quality, 10)
    : 85
  return { format, quality }
}

function getImagesBinding(event: H3Event) {
  const env = (event.context.cloudflare as { env?: WebCloudflareEnv } | undefined)?.env
  return env?.IMAGES
}

export async function serveOptimizedCmsImage(event: H3Event, fullPath: string) {
  const { assetPath, operations } = parseCmsImagePath(fullPath)
  if (!assetPath) {
    throw createError({ statusCode: 404 })
  }

  const config = useRuntimeConfig(event)
  const originUrl = `${config.public.cmsBaseUrl.replace(/\/$/, '')}/images/${assetPath}`

  const cache = typeof caches !== 'undefined' ? caches.default : undefined
  const cacheKey = new Request(new URL(event.path, 'https://cache.local').toString())

  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) {
      return hit
    }
  }

  const origin = await fetch(originUrl)
  if (!origin.ok) {
    throw createError({ statusCode: origin.status === 404 ? 404 : 502, statusMessage: 'Media origin error' })
  }

  const images = getImagesBinding(event)
  let body = origin.body
  let contentType = origin.headers.get('content-type') ?? 'application/octet-stream'

  if (images && hasImageTransformOps(operations) && body) {
    try {
      const pipeline = images.input(body).transform(mapTransformOptions(operations))
      const { response } = await pipeline.output(mapOutputOptions(operations))
      const transformed = await response()
      body = transformed.body
      contentType = transformed.headers.get('content-type') ?? contentType
    }
    catch {
      // Fallback to origin bytes if Images binding fails (e.g. local dev).
    }
  }

  if (!body) {
    throw createError({ statusCode: 404 })
  }

  const response = new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': LONG_CACHE,
    },
  })

  if (cache) {
    const waitUntil = (event.context.cloudflare as { context?: { waitUntil?: (p: Promise<unknown>) => void } } | undefined)
      ?.context
      ?.waitUntil
    const putPromise = cache.put(cacheKey, response.clone())
    if (waitUntil) {
      waitUntil(putPromise)
    }
    else {
      await putPromise
    }
  }

  return response
}
