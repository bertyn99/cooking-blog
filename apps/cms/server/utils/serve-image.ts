import type { H3Event } from 'h3'
import {
  hasImageTransformOps,
  parseIpxImagePath,
} from '../../shared/ipx-image-path'
import {
  IMAGE_DELIVERY_RATE_LIMIT,
  imageDeliveryCacheTags,
  isAllowedMediaAssetPath,
  sanitizeDeliveryOperations,
} from '../../shared/image-delivery-policy'
import { transformImageBufferForDelivery } from '../../shared/image-transform-delivery'
import { getClientIp } from './client-ip'
import { useMediaStorage } from './media-storage'
import { createRequestRateLimiter } from './rate-limit'
import { useKvStore } from './kv'

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
 *
 * **Workers Cache** (Alchemy `cache: { enabled: true }` on the CMS Worker) stores
 * responses at the edge when `Cache-Control` / `Cache-Tag` / `Vary` allow it —
 * see [Alchemy Workers Cache](https://alchemy.run/cloudflare/compute/cache/).
 * Local `nuxt dev` does not enable Workers Cache; only deployed Alchemy workers do.
 */
export async function serveCmsImage(event: H3Event, fullPath: string) {
  const imageLimiter = createRequestRateLimiter(useKvStore(event), IMAGE_DELIVERY_RATE_LIMIT)
  const rate = await imageLimiter.consume(getClientIp(event))
  if (!rate.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many image requests',
    })
  }

  const { assetPath, operations } = parseIpxImagePath(fullPath)
  if (!assetPath) {
    throw createError({ statusCode: 404 })
  }
  if (!isAllowedMediaAssetPath(assetPath)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media path' })
  }

  const deliveryOps = sanitizeDeliveryOperations(operations)
  const wantsTransform = hasImageTransformOps(deliveryOps)

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
      { acceptHeader: event.req.headers.get('accept') ?? undefined },
    )
    if (transformed) {
      body = bufferToStream(transformed.buffer)
      contentType = transformed.contentType
      etag = undefined
    }
    else {
      // Transform unavailable — serve stored bytes (see ensureJsquashRuntime).
      body = bufferToStream(sourceBuffer)
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': LONG_CACHE,
    'Cache-Tag': imageDeliveryCacheTags(assetPath),
    'Content-Security-Policy': "default-src 'none'",
  }
  if (wantsTransform) {
    headers.Vary = 'Accept'
  }
  if (etag) {
    headers.ETag = etag
  }

  return new Response(body, { headers })
}
