import { IMAGE_OPTIMIZE } from './image-optimize'

/** On-demand delivery limits (aligned with ingest max edge). */
export const IMAGE_DELIVERY = {
  maxEdgePx: IMAGE_OPTIMIZE.maxEdgePx,
  defaultQuality: 85,
  minQuality: 1,
  maxQuality: 100,
} as const

const MEDIA_UPLOAD_PREFIX = 'uploads/'

/** IPX modifiers implemented by jSquash delivery (others are ignored). */
export const SUPPORTED_DELIVERY_OPERATION_KEYS = new Set([
  'width',
  'height',
  'format',
  'quality',
  'fit',
  'resize',
  'enlarge',
])

export function isAllowedMediaAssetPath(assetPath: string): boolean {
  const normalized = assetPath.replace(/^\/+/, '')
  return normalized.startsWith(MEDIA_UPLOAD_PREFIX)
    && !normalized.includes('..')
    && !normalized.includes('\\')
}

export function sanitizeDeliveryOperations(
  operations: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(operations)) {
    if (SUPPORTED_DELIVERY_OPERATION_KEYS.has(key)) {
      out[key] = value
    }
  }
  return out
}

export function clampDeliveryDimension(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined
  }
  return Math.min(Math.round(value), IMAGE_DELIVERY.maxEdgePx)
}

export function clampDeliveryQuality(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return IMAGE_DELIVERY.defaultQuality
  }
  return Math.min(IMAGE_DELIVERY.maxQuality, Math.max(IMAGE_DELIVERY.minQuality, Math.round(value)))
}

export function allowsUpscale(operations: Record<string, string>): boolean {
  return operations.enlarge === 'true'
}

/** IPX `f_auto`: pick WebP / JPEG from Accept (no AVIF encoder in jSquash). */
export function resolveDeliveryFormat(
  format: string | undefined,
  acceptHeader: string | null | undefined,
): string | undefined {
  if (!format || format === 'auto') {
    const accept = acceptHeader?.toLowerCase() ?? ''
    if (accept.includes('image/webp')) {
      return 'webp'
    }
    if (accept.includes('image/jpeg') || accept.includes('image/jpg')) {
      return 'jpeg'
    }
    return 'webp'
  }
  return format
}

/** Cache API key: pathname only (ignore query / host variance). */
export function imageDeliveryCacheRequest(pathname: string): Request {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return new Request(`https://image-cache.local${path}`)
}

export function imageDeliveryCacheTags(assetPath: string): string {
  const normalized = assetPath.replace(/^\/+/, '')
  const safe = normalized.replace(/[^\w./-]+/g, '_')
  return `media,media-path-${safe}`
}

/** KV fixed-window limits for public `GET /images/**` (per connecting IP). */
export const IMAGE_DELIVERY_RATE_LIMIT = {
  prefix: 'images:req',
  maxRequests: 120,
  windowSeconds: 60,
} as const
