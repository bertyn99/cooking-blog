import { encode as encodeJpeg } from '@jsquash/jpeg'
import { encode as encodePng } from '@jsquash/png'
import resize from '@jsquash/resize'
import { encode as encodeWebp } from '@jsquash/webp'
import { decodeImage, rasterToImageData, type OptimizedImageResult } from './image-optimize-pipeline'

export interface DeliveryTransformOps {
  width?: number
  height?: number
  fit?: string
  format?: string
  quality?: number
}

export function parseDeliveryTransformOps(operations: Record<string, string>): DeliveryTransformOps {
  const width = operations.width ? Number.parseInt(operations.width, 10) : undefined
  const height = operations.height ? Number.parseInt(operations.height, 10) : undefined
  const quality = operations.quality ? Number.parseInt(operations.quality, 10) : undefined
  return {
    width: Number.isFinite(width) ? width : undefined,
    height: Number.isFinite(height) ? height : undefined,
    fit: operations.fit,
    format: operations.format,
    quality: Number.isFinite(quality) ? quality : undefined,
  }
}

export interface DeliveryResizePlan {
  resizeWidth: number
  resizeHeight: number
  fitMethod?: 'stretch' | 'contain'
  cropTo?: { width: number, height: number }
}

/** Map Nuxt Image / `localImageSharp` ops to @jsquash/resize options. */
export function planDeliveryResize(
  sourceWidth: number,
  sourceHeight: number,
  ops: Pick<DeliveryTransformOps, 'width' | 'height' | 'fit'>,
): DeliveryResizePlan | null {
  const targetWidth = ops.width
  const targetHeight = ops.height
  if (!targetWidth && !targetHeight) {
    return null
  }

  if (targetWidth && !targetHeight) {
    const ratio = targetWidth / sourceWidth
    return {
      resizeWidth: targetWidth,
      resizeHeight: Math.max(1, Math.round(sourceHeight * ratio)),
    }
  }

  if (!targetWidth && targetHeight) {
    const ratio = targetHeight / sourceHeight
    return {
      resizeWidth: Math.max(1, Math.round(sourceWidth * ratio)),
      resizeHeight: targetHeight,
    }
  }

  const width = targetWidth!
  const height = targetHeight!
  const fit = ops.fit ?? 'cover'

  if (fit === 'contain' || fit === 'inside') {
    return { resizeWidth: width, resizeHeight: height, fitMethod: 'contain' }
  }

  if (fit === 'cover') {
    const scale = Math.max(width / sourceWidth, height / sourceHeight)
    return {
      resizeWidth: Math.max(1, Math.round(sourceWidth * scale)),
      resizeHeight: Math.max(1, Math.round(sourceHeight * scale)),
      cropTo: { width, height },
    }
  }

  return { resizeWidth: width, resizeHeight: height, fitMethod: 'stretch' }
}

function cropCenter(image: ImageData, width: number, height: number): ImageData {
  const left = Math.max(0, Math.floor((image.width - width) / 2))
  const top = Math.max(0, Math.floor((image.height - height) / 2))
  const out = new ImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = left + x
      const srcY = top + y
      const srcIndex = (srcY * image.width + srcX) * 4
      const dstIndex = (y * width + x) * 4
      out.data[dstIndex] = image.data[srcIndex]!
      out.data[dstIndex + 1] = image.data[srcIndex + 1]!
      out.data[dstIndex + 2] = image.data[srcIndex + 2]!
      out.data[dstIndex + 3] = image.data[srcIndex + 3]!
    }
  }
  return out
}

function outputMimeFromFormat(format: string | undefined): string {
  if (format === 'avif') {
    // No AVIF encoder in jSquash; deliver WebP bytes with a WebP content-type.
    return 'image/webp'
  }
  switch (format) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'avif':
      return 'image/webp'
    case 'webp':
    default:
      return 'image/webp'
  }
}

async function encodeRaster(
  image: ImageData,
  format: string | undefined,
  quality: number,
): Promise<ArrayBuffer | null> {
  const mime = outputMimeFromFormat(format)
  if (mime === 'image/jpeg') {
    return encodeJpeg(image, { quality }) as Promise<ArrayBuffer | null>
  }
  if (mime === 'image/png') {
    return encodePng(image) as Promise<ArrayBuffer | null>
  }
  if (mime === 'image/avif') {
    return encodeWebp(image, { quality }) as Promise<ArrayBuffer | null>
  }
  return encodeWebp(image, { quality }) as Promise<ArrayBuffer | null>
}

/**
 * On-the-fly resize / re-encode for `apps/web` `/images/{ops}/…` (Cloudflare Worker via jSquash WASM).
 * @see https://github.com/jamsinclair/jSquash/tree/main/examples/cloudflare-worker-esm-format
 */
export async function transformImageBufferForDelivery(
  buffer: ArrayBuffer,
  mime: string,
  operations: Record<string, string>,
): Promise<OptimizedImageResult | null> {
  const ops = parseDeliveryTransformOps(operations)
  const decoded = await decodeImage(buffer, mime)
  if (!decoded) {
    return null
  }

  let imageData = rasterToImageData(decoded)
  const plan = planDeliveryResize(decoded.width, decoded.height, ops)
  if (plan) {
    const resized = await resize(imageData, {
      width: plan.resizeWidth,
      height: plan.resizeHeight,
      ...(plan.fitMethod ? { fitMethod: plan.fitMethod } : {}),
    })
    if (!resized) {
      return null
    }
    imageData = plan.cropTo
      ? cropCenter(resized, plan.cropTo.width, plan.cropTo.height)
      : resized
  }

  const quality = ops.quality ?? 85
  const encoded = await encodeRaster(imageData, ops.format, quality)
  if (!encoded) {
    return null
  }

  return {
    buffer: encoded,
    contentType: outputMimeFromFormat(ops.format),
  }
}
