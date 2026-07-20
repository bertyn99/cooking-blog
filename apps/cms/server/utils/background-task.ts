import type { H3Event } from 'h3'

type CloudflareExecutionContext = {
  waitUntil?: (promise: Promise<unknown>) => void
}

function getWaitUntil(event: H3Event) {
  const cloudflare = event.context.cloudflare as {
    context?: CloudflareExecutionContext
    waitUntil?: (promise: Promise<unknown>) => void
  } | undefined

  return cloudflare?.context?.waitUntil ?? cloudflare?.waitUntil
}

/**
 * Runs work after the HTTP response on Workers (`waitUntil`).
 * In local dev (no `waitUntil`), awaits the work so imports actually finish.
 */
export async function runInBackground(event: H3Event, work: () => Promise<void>) {
  const promise = work().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[background-task] ${message}`)
  })

  const waitUntil = getWaitUntil(event)
  if (waitUntil) {
    waitUntil(promise)
    return
  }

  await promise
}
