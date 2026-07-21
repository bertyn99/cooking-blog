import { optimizeImageBuffer } from '#shared/image-optimize-pipeline'
import { filenameWithWebpExtension } from '#shared/image-optimize'

/**
 * Compress in the browser before `POST /api/media` (jSquash WebP).
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  const optimized = await optimizeImageBuffer(buffer, file.type || 'image/jpeg', {
    filename: file.name,
  })

  if (!optimized) {
    return file
  }

  const name = optimized.filename ?? filenameWithWebpExtension(file.name)
  return new File([optimized.buffer], name, { type: optimized.contentType })
}
