import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export function previewTokenMatches(expected: string | undefined, provided: string | undefined): boolean {
  const left = (expected ?? '').trim()
  const right = (provided ?? '').trim()
  if (!left || !right) {
    return false
  }
  const leftBuf = Buffer.from(left)
  const rightBuf = Buffer.from(right)
  if (leftBuf.length !== rightBuf.length) {
    return false
  }
  return timingSafeEqual(leftBuf, rightBuf)
}

export function isCmsPreviewRequest(event: H3Event): boolean {
  const expected = String(useRuntimeConfig(event).cmsPreviewToken || '')
  const provided = getHeader(event, 'x-cms-preview-token')
  return previewTokenMatches(expected, provided)
}

export async function isPrivilegedContentRead(event: H3Event): boolean {
  const session = await getUserSession(event)
  return Boolean(session.user) || isCmsPreviewRequest(event)
}
