import { decode as decodeJpeg } from '@jsquash/jpeg'
import { decode as decodePng } from '@jsquash/png'
import resize from '@jsquash/resize'
import { decode as decodeWebp, encode as encodeWebp } from '@jsquash/webp'
import {
  IMAGE_OPTIMIZE,
  pathnameWithWebpExtension,
  scaleToMaxEdge,
  shouldSkipImageOptimize,
  type RasterImage,
} from './image-optimize'

export interface OptimizedImageResult {
  buffer: ArrayBuffer
  contentType: string
  pathname?: string
  filename?: string
}

async function decodeImage(buffer: ArrayBuffer, mime: string): Promise<RasterImage | null> {
  const bytes = new Uint8Array(buffer)
  let decoded: ImageData | null = null
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    decoded = await decodeJpeg(bytes) as ImageData | null
  }
  else if (mime === 'image/png') {
    decoded = await decodePng(bytes) as ImageData | null
  }
  else if (mime === 'image/webp') {
    decoded = await decodeWebp(bytes) as ImageData | null
  }
  if (!decoded) {
    return null
  }
  return {
    data: new Uint8Array(decoded.data),
    width: decoded.width,
    height: decoded.height,
  }
}

/** Resize + WebP encode for R2 storage (Workers + browser). */
export async function optimizeImageBuffer(
  buffer: ArrayBuffer,
  mime: string,
  opts?: { pathname?: string, filename?: string },
): Promise<OptimizedImageResult | null> {
  if (shouldSkipImageOptimize(mime, buffer.byteLength)) {
    return null
  }

  const decoded = await decodeImage(buffer, mime)
  if (!decoded) {
    return null
  }

  const target = scaleToMaxEdge(decoded.width, decoded.height, IMAGE_OPTIMIZE.maxEdgePx)
  let image: RasterImage = decoded
  if (target.width !== decoded.width || target.height !== decoded.height) {
    const resized = await resize(decoded as ImageData, {
      width: target.width,
      height: target.height,
    })
    if (!resized) {
      return null
    }
    image = {
      data: new Uint8Array(resized.data),
      width: resized.width,
      height: resized.height,
    }
  }

  const webpBuffer = await encodeWebp(image as ImageData, {
    quality: IMAGE_OPTIMIZE.webpQuality,
  })
  if (!webpBuffer) {
    return null
  }

  return {
    buffer: webpBuffer,
    contentType: IMAGE_OPTIMIZE.outputMime,
    pathname: opts?.pathname ? pathnameWithWebpExtension(opts.pathname) : undefined,
    filename: opts?.filename
      ? opts.filename.replace(/\.[^./]+$/, IMAGE_OPTIMIZE.outputExt)
      : undefined,
  }
}
