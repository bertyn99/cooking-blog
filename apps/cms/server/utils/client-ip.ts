import type { H3Event } from 'h3'

/** Client IP for rate limiting (Cloudflare Workers prefer cf-connecting-ip). */
export function getClientIp(event: H3Event): string {
  const cfIp = event.req.headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }
  const forwarded = event.req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  const nodeReq = (event as unknown as { node?: { req?: { remoteAddress?: string } } }).node
  if (nodeReq?.req?.remoteAddress) {
    return nodeReq.req.remoteAddress
  }
  return 'unknown'
}
