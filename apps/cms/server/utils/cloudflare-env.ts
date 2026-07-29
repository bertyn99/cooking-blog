import type { H3Event } from 'h3'
import type { CloudflareBindings } from '../types/cloudflare'

export function getCloudflareEnv(event?: H3Event): CloudflareBindings | undefined {
  const fromEvent = event?.context?.cloudflare?.env
  if (fromEvent?.DB) {
    return fromEvent
  }

  try {
    const current = useEvent()
    const fromAsync = current?.context?.cloudflare?.env
    if (fromAsync?.DB) {
      return fromAsync
    }
  }
  catch {
    // No request context (e.g. some task runners)
  }

  return undefined
}
