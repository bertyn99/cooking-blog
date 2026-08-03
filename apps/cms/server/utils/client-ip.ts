import type { H3Event } from 'h3'
import { getHeader, getRequestHeaders } from 'h3'

/** Client IP for rate limiting (Cloudflare Workers prefer cf-connecting-ip). */
export function getClientIp(event: H3Event): string {
  const cfIp = getHeader(event, 'cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }
  const headers = getRequestHeaders(event)
  const forwarded = headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim()
  }
  const nodeReq = (event as unknown as { node?: { req?: { remoteAddress?: string } } }).node
  if (nodeReq?.req?.remoteAddress) {
    return nodeReq.req.remoteAddress
  }
  return 'unknown'
}
