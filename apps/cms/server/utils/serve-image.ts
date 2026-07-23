import type { H3Event } from 'h3'
import { getHeader, getRequestURL } from 'h3'
import {
  hasImageTransformOps,
  parseIpxImagePath,
} from '../../shared/ipx-image-path'
import {
  imageDeliveryCacheRequest,
  isAllowedMediaAssetPath,
  sanitizeDeliveryOperations,
} from '../../shared/image-delivery-policy'
import { transformImageBufferForDelivery } from '../../shared/image-transform-delivery'
import { runInBackground } from './background-task'
import { useMediaStorage } from './media-storage'

const LONG_CACHE = 'public, max-age=31536000, stale-while-revalidate=604800'

function bufferToStream(buffer: ArrayBuffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer))
      controller.close()
    },
  })
}

async function streamToArrayBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
  const response = new Response(stream)
  return response.arrayBuffer()
}

/**
 * Serve CMS media with optional IPX-style transforms (`/images/w_800,f_webp/uploads/…`).
 * Transformed (and origin) responses are cached via the Worker Cache API when available.
 */
export async function serveCmsImage(event: H3Event, fullPath: string) {
  const { assetPath, operations } = parseIpxImagePath(fullPath)
  if (!assetPath) {
    throw createError({ statusCode: 404 })
  }
  if (!isAllowedMediaAssetPath(assetPath)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
  }

  const deliveryOps = sanitizeDeliveryOperations(operations)
  const wantsTransform = hasImageTransformOps(deliveryOps)

  const cache = typeof caches !== 'undefined' ? caches.default : undefined
  const cacheKey = imageDeliveryCacheRequest(getRequestURL(event).pathname)

  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) {
      return hit
    }
  }

  const storage = useMediaStorage(event)
  const result = await storage.get(assetPath)
  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Media not found' })
  }

  let body: ReadableStream = result.body
  let contentType = result.object.contentType
  let etag = result.object.etag

  if (wantsTransform) {
    const sourceBuffer = await streamToArrayBuffer(result.body)
    const transformed = await transformImageBufferForDelivery(
      sourceBuffer,
      contentType,
      deliveryOps,
      { acceptHeader: getHeader(event, 'accept') },
    )
    if (!transformed) {
      throw createError({ statusCode: 502, statusMessage: 'Image transform failed' })
    }
    body = bufferToStream(transformed.buffer)
    contentType = transformed.contentType
    etag = undefined
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': LONG_CACHE,
    'Content-Security-Policy': "default-src 'none'",
  }
  if (etag) {
    headers.ETag = etag
  }

  const response = new Response(body, { headers })

  if (cache) {
    const cached = response.clone()
    await runInBackground(event, async () => {
      await cache.put(cacheKey, cached)
    })
  }

  return response
}
