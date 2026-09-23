import type { H3Event } from 'h3'

/** Canonical public site origin (no trailing slash) for RSS and absolute URLs. */
export function getPublicSiteOrigin(event?: H3Event): string {
  const config = useRuntimeConfig(event)
  const raw =
    (config.site?.url as string | undefined) ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}
