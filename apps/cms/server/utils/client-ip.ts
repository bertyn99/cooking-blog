import type { H3Event } from 'h3'

/** Client IP for rate limiting (Cloudflare Workers prefer cf-connecting-ip). */
export function getClientIp(event: H3Event): string {
  const cfIp = getHeader(event, 'cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  const remote = event.node?.req?.socket?.remoteAddress
  if (remote) {
    return remote
  }
  return 'unknown'
}
