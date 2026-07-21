/** Shared ingest policy: browser uploads + Strapi import → WebP in R2. */
export const IMAGE_OPTIMIZE = {
  maxEdgePx: 2560,
  /** jSquash WebP quality 0–100 */
  webpQuality: 82,
  /** Skip re-encoding small WebP files */
  skipWebpUnderBytes: 512 * 1024,
  outputMime: 'image/webp',
  outputExt: '.webp',
} as const

const SKIP_MIME = new Set(['image/gif', 'image/svg+xml'])

export function shouldSkipImageOptimize(mime: string, byteLength: number): boolean {
  if (!mime.startsWith('image/')) {
    return true
  }
  if (SKIP_MIME.has(mime)) {
    return true
  }
  if (mime === IMAGE_OPTIMIZE.outputMime && byteLength <= IMAGE_OPTIMIZE.skipWebpUnderBytes) {
    return true
  }
  return false
}

export function pathnameWithWebpExtension(pathname: string): string {
  const slash = pathname.lastIndexOf('/')
  const dir = slash >= 0 ? pathname.slice(0, slash + 1) : ''
  const file = slash >= 0 ? pathname.slice(slash + 1) : pathname
  const base = file.replace(/\.[^./]+$/, '')
  return `${dir}${base}${IMAGE_OPTIMIZE.outputExt}`
}

export function filenameWithWebpExtension(filename: string): string {
  const base = filename.replace(/\.[^./]+$/, '')
  return `${base}${IMAGE_OPTIMIZE.outputExt}`
}

export interface RasterImage {
  data: Uint8Array
  width: number
  height: number
}

export function scaleToMaxEdge(width: number, height: number, maxEdge: number): { width: number, height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) {
    return { width, height }
  }
  const ratio = maxEdge / longest
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}
