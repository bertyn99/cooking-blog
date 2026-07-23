import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import { buildIpxImagePath, parseIpxImagePath } from '../../../cms/shared/ipx-image-path'
import { toCmsStoragePath } from '../../shared/media-public-path'

const LONG_CACHE = 'public, max-age=31536000, stale-while-revalidate=604800'

/** Map a web `/images/...` path to the CMS IPX image URL (storage path + modifiers). */
export function toCmsImageOriginPath(fullPath: string): string {
  const { assetPath, modifiersSegment } = parseIpxImagePath(fullPath)
  const storagePath = toCmsStoragePath(assetPath)
  return buildIpxImagePath(storagePath, modifiersSegment)
}

/**
 * Proxy CMS image responses. Transforms (jSquash + IPX ops) and caching run on the CMS only.
 */
export async function serveOptimizedCmsImage(event: H3Event, fullPath: string) {
  const originPath = toCmsImageOriginPath(fullPath)
  if (!originPath) {
    throw createError({ statusCode: 404 })
  }

  const config = useRuntimeConfig(event)
  const originUrl = `${config.public.cmsBaseUrl.replace(/\/$/, '')}/images/${originPath}`

  const origin = await fetch(originUrl, {
    headers: {
      accept: getHeader(event, 'accept') ?? 'image/webp,image/*,*/*',
    },
  })
  if (!origin.ok) {
    if (import.meta.dev) {
      console.error('[cms-image] origin fetch failed', {
        originUrl,
        status: origin.status,
        statusText: origin.statusText,
      })
    }
    throw createError({
      statusCode: origin.status === 404 ? 404 : 502,
      statusMessage: 'Media origin error',
    })
  }

  const body = origin.body
  if (!body) {
    throw createError({ statusCode: 404 })
  }

  return new Response(body, {
    headers: {
      'Content-Type': origin.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': origin.headers.get('cache-control') ?? LONG_CACHE,
    },
  })
}
