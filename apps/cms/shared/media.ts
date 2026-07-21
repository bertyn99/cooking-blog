/** Max size for browser uploads via `POST /api/media` (R2 / local storage). */
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024

export function formatMediaByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`
  }
  const mb = bytes / (1024 * 1024)
  return mb >= 10 ? `${Math.round(mb)} Mo` : `${mb.toFixed(1).replace('.', ',')} Mo`
}

export function maxImageUploadSizeLabel(): string {
  return formatMediaByteSize(MAX_IMAGE_UPLOAD_BYTES)
}

export function isWithinImageUploadLimit(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_IMAGE_UPLOAD_BYTES
}
