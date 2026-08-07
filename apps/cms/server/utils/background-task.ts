import type { H3Event } from 'h3'
import { logBackgroundError, type LogContext } from './logging'

type CloudflareExecutionContext = {
  waitUntil?: (promise: Promise<unknown>) => void
}

function getCloudflareContext(event: H3Event) {
  return (
    event.context.cloudflare as
      | {
          context?: CloudflareExecutionContext
          waitUntil?: (promise: Promise<unknown>) => void
        }
      | undefined
  )?.context
}

/**
 * True when the import can safely continue after the HTTP response (Workers production).
 * Wrangler dev exposes `waitUntil` but calling it unbound throws — we run inline in dev.
 */
export function shouldDeferWorkToBackground(event: H3Event): boolean {
  if (import.meta.dev) {
    return false
  }
  const ctx = getCloudflareContext(event)
  return typeof ctx?.waitUntil === 'function'
}

/**
 * Runs work after the HTTP response on Workers (`waitUntil`).
 * In local dev, awaits the work so imports actually finish.
 */
export async function runInBackground(
  event: H3Event,
  work: () => Promise<void>,
  context: LogContext & { task?: string } = {}
) {
  const promise = work().catch((error: unknown) => {
    const { task = 'background-task', ...details } = context
    logBackgroundError(task, error, details)
  })

  const ctx = getCloudflareContext(event)
  if (ctx?.waitUntil) {
    ctx.waitUntil(promise)
    return
  }

  await promise
}
