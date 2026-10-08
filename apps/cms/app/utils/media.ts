/**
 * Public URL for a blob stored in R2.
 * - No modifiers → canonical media path `/uploads/<file>` — serves any media
 *   type (image, video, pdf…); even generated media lives under `uploads/`.
 * - With IPX modifiers → image transform path `/images/{modifiers}/<file>`.
 * @see https://github.com/unjs/ipx
 */
export const MEDIA_IMAGE_IPX = {
  thumb: 'w_400,f_webp,q_80',
  picker: 'w_320,f_webp,q_80',
  coverPreview: 'w_800,f_webp,q_82',
  detail: 'w_1200,f_webp,q_85',
} as const

export function mediaPublicUrl(pathname: string, modifiers?: string): string {
  const path = pathname.replace(/^\/+/, '')
  if (!modifiers || modifiers === '_') {
    const key = path.startsWith('uploads/') ? path.slice('uploads/'.length) : path
    return `/uploads/${key}`
  }
  return `/images/${modifiers}/${path}`
}

export function mediaThumbnailUrl(pathname: string): string {
  return mediaPublicUrl(pathname, MEDIA_IMAGE_IPX.thumb)
}

export function mediaPickerThumbUrl(pathname: string): string {
  return mediaPublicUrl(pathname, MEDIA_IMAGE_IPX.picker)
}

export function mediaCoverPreviewUrl(pathname: string): string {
  return mediaPublicUrl(pathname, MEDIA_IMAGE_IPX.coverPreview)
}

export function mediaDetailPreviewUrl(pathname: string): string {
  return mediaPublicUrl(pathname, MEDIA_IMAGE_IPX.detail)
}

export function mediaAltFromPathname(pathname: string): string {
  const base = pathname.split('/').pop() ?? 'image'
  return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'image'
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback
  }
  const err = error as {
    data?: { statusMessage?: string, message?: string }
    statusMessage?: string
    message?: string
  }
  return err.data?.statusMessage
    ?? err.data?.message
    ?? err.statusMessage
    ?? err.message
    ?? fallback
}
