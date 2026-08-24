import type { H3Event } from 'nitro/h3'
import { createLogger, useLogger } from 'evlog'

export type LogContext = Record<string, unknown>

/** Preserve useful error details when a boundary receives an unknown value. */
export function toLogError(error: unknown): Error | string {
  if (error instanceof Error || typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}

/** Add an error to the current request's single evlog wide event. */
export function logRequestError(event: H3Event, error: unknown, context?: LogContext) {
  useLogger(event as Parameters<typeof useLogger>[0]).error(toLogError(error), context)
}

/** Add a warning to the current request's single evlog wide event. */
export function logRequestWarning(event: H3Event, message: string, context?: LogContext) {
  useLogger(event as Parameters<typeof useLogger>[0]).warn(message, context)
}

/** Emit one standalone wide event for work that runs outside an HTTP request. */
export function logBackgroundError(task: string, error: unknown, context?: LogContext) {
  const log = createLogger({ task })
  log.error(toLogError(error), context)
  log.emit()
}

/** Emit one standalone wide event for a warning from a task or worker callback. */
export function logBackgroundWarning(task: string, message: string, context?: LogContext) {
  const log = createLogger({ task })
  log.warn(message, context)
  log.emit()
}
