/** Strip legacy `/uploads/` prefix — public site URLs use `/images/.../{key}`. */
export function toPublicMediaKey(path: string): string {
  return path.replace(/^\/+/, '').replace(/^uploads\//, '')
}

export interface PublicDeliveryImageOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
  format?: 'webp' | 'png' | 'jpeg' | 'avif'
}

/**
 * Build a site-relative IPX-style path for the web Worker image proxy
 * (`/images/w_800,f_webp/…`) from a CMS blob key or legacy `/uploads/…` path.
 */
export function buildPublicDeliveryImagePath(
  src: string,
  options: PublicDeliveryImageOptions = {},
): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('/images/') || trimmed.startsWith('/img/')) {
    return trimmed
  }

  const key = toPublicMediaKey(trimmed)
  if (!key) return ''

  const modifiers: string[] = []
  if (options.width) modifiers.push(`w_${options.width}`)
  if (options.height) modifiers.push(`h_${options.height}`)
  if (options.fit) modifiers.push(`fit_${options.fit}`)
  if (options.format) modifiers.push(`f_${options.format}`)

  if (!modifiers.length) {
    return `/images/${key}`
  }
  return `/images/${modifiers.join(',')}/${key}`
}
