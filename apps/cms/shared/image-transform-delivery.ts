import { encode as encodeJpeg } from '@jsquash/jpeg'
import { encode as encodePng } from '@jsquash/png'
import resize from '@jsquash/resize'
import { encode as encodeWebp } from '@jsquash/webp'
import {
  allowsUpscale,
  clampDeliveryDimension,
  clampDeliveryQuality,
  resolveDeliveryFormat,
} from './image-delivery-policy'
import { decodeImage, rasterToImageData, type OptimizedImageResult } from './image-optimize-pipeline'
import { ensureJsquashRuntime } from './jsquash-runtime'

export interface DeliveryTransformOps {
  width?: number
  height?: number
  fit?: string
  format?: string
  quality?: number
  allowUpscale?: boolean
}

export function parseDeliveryTransformOps(
  operations: Record<string, string>,
  context?: { acceptHeader?: string | null },
): DeliveryTransformOps {
  const width = operations.width ? Number.parseInt(operations.width, 10) : undefined
  const height = operations.height ? Number.parseInt(operations.height, 10) : undefined
  const quality = operations.quality ? Number.parseInt(operations.quality, 10) : undefined
  const format = resolveDeliveryFormat(operations.format, context?.acceptHeader)
  return {
    width: clampDeliveryDimension(width),
    height: clampDeliveryDimension(height),
    fit: operations.fit,
    format,
    quality: clampDeliveryQuality(quality),
    allowUpscale: allowsUpscale(operations),
  }
}

export interface DeliveryResizePlan {
  resizeWidth: number
  resizeHeight: number
  fitMethod?: 'stretch' | 'contain'
  cropTo?: { width: number, height: number }
}

function capPlanToSource(
  plan: DeliveryResizePlan,
  sourceWidth: number,
  sourceHeight: number,
  allowUpscale: boolean,
): DeliveryResizePlan {
  if (allowUpscale) {
    return plan
  }
  if (plan.resizeWidth <= sourceWidth && plan.resizeHeight <= sourceHeight) {
    return plan
  }
  const ratio = Math.min(1, sourceWidth / plan.resizeWidth, sourceHeight / plan.resizeHeight)
  const resizeWidth = Math.max(1, Math.round(plan.resizeWidth * ratio))
  const resizeHeight = Math.max(1, Math.round(plan.resizeHeight * ratio))
  const cropTo = plan.cropTo
    ? {
        width: Math.min(plan.cropTo.width, resizeWidth),
        height: Math.min(plan.cropTo.height, resizeHeight),
      }
    : undefined
  return { ...plan, resizeWidth, resizeHeight, cropTo }
}

/** Map IPX / Nuxt Image ops to @jsquash/resize options. */
export function planDeliveryResize(
  sourceWidth: number,
  sourceHeight: number,
  ops: Pick<DeliveryTransformOps, 'width' | 'height' | 'fit' | 'allowUpscale'>,
): DeliveryResizePlan | null {
  const targetWidth = ops.width
  const targetHeight = ops.height
  if (!targetWidth && !targetHeight) {
    return null
  }

  const allowUpscale = ops.allowUpscale ?? false
  let plan: DeliveryResizePlan

  if (targetWidth && !targetHeight) {
    plan = {
      resizeWidth: targetWidth,
      resizeHeight: Math.max(1, Math.round(sourceHeight * (targetWidth / sourceWidth))),
    }
  }
  else if (!targetWidth && targetHeight) {
    plan = {
      resizeWidth: Math.max(1, Math.round(sourceWidth * (targetHeight / sourceHeight))),
      resizeHeight: targetHeight,
    }
  }
  else {
    const width = targetWidth!
    const height = targetHeight!
    const fit = ops.fit ?? 'cover'

    if (fit === 'contain' || fit === 'inside') {
      plan = { resizeWidth: width, resizeHeight: height, fitMethod: 'contain' }
    }
    else if (fit === 'outside') {
      const scale = Math.max(width / sourceWidth, height / sourceHeight)
      plan = {
        resizeWidth: Math.max(1, Math.round(sourceWidth * scale)),
        resizeHeight: Math.max(1, Math.round(sourceHeight * scale)),
      }
    }
    else if (fit === 'cover') {
      const scale = Math.max(width / sourceWidth, height / sourceHeight)
      plan = {
        resizeWidth: Math.max(1, Math.round(sourceWidth * scale)),
        resizeHeight: Math.max(1, Math.round(sourceHeight * scale)),
        cropTo: { width, height },
      }
    }
    else {
      plan = { resizeWidth: width, resizeHeight: height, fitMethod: 'stretch' }
    }
  }

  return capPlanToSource(plan, sourceWidth, sourceHeight, allowUpscale)
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
  return encodeWebp(image, { quality }) as Promise<ArrayBuffer | null>
}

/**
 * On-the-fly resize / re-encode for CMS `GET /images/{ipx-ops}/…` (Workers + dashboard via jSquash).
 */
export async function transformImageBufferForDelivery(
  buffer: ArrayBuffer,
  mime: string,
  operations: Record<string, string>,
  context?: { acceptHeader?: string | null },
): Promise<OptimizedImageResult | null> {
  try {
    await ensureJsquashRuntime()
    const ops = parseDeliveryTransformOps(operations, context)
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

    const shouldEncode = Boolean(plan || ops.format || operations.quality)
    if (!shouldEncode) {
      return null
    }

    const encoded = await encodeRaster(imageData, ops.format, ops.quality ?? 85)
    if (!encoded) {
      return null
    }

    return {
      buffer: encoded,
      contentType: outputMimeFromFormat(ops.format),
    }
  }
  catch {
    return null
  }
}
