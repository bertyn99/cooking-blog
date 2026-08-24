import type { H3Event } from 'nitro/h3'
import { getCloudflareEnv } from './cloudflare-env'

/**
 * R2 Media bucket binding (CMS Worker only).
 * Returns undefined in local dev without Cloudflare bindings — media falls back to `.data/media/`.
 */
export function useR2(event?: H3Event): R2Bucket | undefined {
  return getCloudflareEnv(event)?.Media
}
