import { mediaPublicUrl } from '~/utils/media'

/** Resolve a Comark block image attr to a URL the CMS preview can load. */
export function resolvePreviewMediaSrc(raw: string | undefined | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^(https?:\/\/|blob:|data:)/.test(value)) return value
  if (value.startsWith('/images/')) return value

  if (value.startsWith('/img/')) {
    const config = useRuntimeConfig()
    const site = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
    return `${site}${value}`
  }

  return mediaPublicUrl(value)
}
