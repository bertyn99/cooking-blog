import type { H3Event } from 'h3'

const MEDIA_GENERATE_TIMEOUT_MS = 120_000

/**
 * Combines client disconnect abort with a server-side timeout.
 * Falls back to timeout-only when the platform request has no abort signal.
 */
export function resolveRequestAbortSignal(
  event: H3Event,
  timeoutMs = MEDIA_GENERATE_TIMEOUT_MS,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  // `event.req` is the web Request under Nitro v3 (has `.signal` for client disconnect)
  // and the Node IncomingMessage under v2; fall back to `event.node.req` for older runtimes.
  const requestSignal =
    (event.req as { signal?: AbortSignal } | undefined)?.signal ??
    (event.node?.req as { signal?: AbortSignal } | undefined)?.signal

  if (requestSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, requestSignal])
  }

  return timeoutSignal
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }
  if (error instanceof Error && /abort/i.test(error.message)) {
    return true
  }
  return false
}
