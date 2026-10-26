import type { H3Event } from 'h3'
import type { CloudflareBindings, WorkersCachePurge } from '../types/cloudflare'

/** Shape of the Cloudflare runtime object attached to the request (env + ExecutionContext). */
export interface CloudflareRuntime {
  env: CloudflareBindings
  context?: {
    waitUntil?: (promise: Promise<unknown>) => void
    cache?: WorkersCachePurge
  }
}

/**
 * Forward-compatible Cloudflare runtime accessor.
 * - Nitro v3 attaches it to the web Request: `event.req.runtime.cloudflare`
 * - Nitro v2 attaches it to the event context: `event.context.cloudflare`
 */
export function getCloudflareRuntime(event?: H3Event): CloudflareRuntime | undefined {
  // Nitro v3: runtime hangs off the web Request's `runtime` property (untyped in H3 v1).
  const v3 = (
    event as { req?: { runtime?: { cloudflare?: CloudflareRuntime } } } | undefined
  )?.req?.runtime?.cloudflare
  if (v3) {
    return v3
  }
  // Nitro v2: typed via the H3EventContext augmentation in server/types/cloudflare.ts.
  return event?.context?.cloudflare
}

export function getCloudflareEnv(event?: H3Event): CloudflareBindings | undefined {
  const fromEvent = getCloudflareRuntime(event)?.env
  if (fromEvent?.DB || fromEvent?.AI) {
    return fromEvent
  }

  // Cron / workflows have no request. Nitro's Cloudflare `scheduled()` sets
  // this so tasks can reach bindings. @see nitropack cloudflare `_module-handler`.
  const fromGlobal = (globalThis as { __env__?: CloudflareBindings }).__env__
  if (fromGlobal?.DB || fromGlobal?.AI) {
    return fromGlobal
  }

  return undefined
}
