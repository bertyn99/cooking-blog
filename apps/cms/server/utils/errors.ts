import { createError as h3CreateError } from 'h3'
import { isQueryError, type QueryErrorCode } from '../db/query-errors'

/**
 * Creates a consistent API error using H3's native createError.
 * Named createApiError to avoid shadowing H3's built-in.
 */
export function createApiError(
  code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL_ERROR',
  message: string,
  details?: unknown,
) {
  const statusMap = {
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  }
  return h3CreateError({
    statusCode: statusMap[code],
    statusMessage: message,
    data: { error: { code, message, details } },
  })
}

const queryCodeToApi: Record<QueryErrorCode, Parameters<typeof createApiError>[0]> = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
}

/** Map query-layer errors to HTTP errors in route handlers. */
export function fromQueryError(error: unknown): never {
  if (isQueryError(error)) {
    throw createApiError(queryCodeToApi[error.code], error.message, error.details)
  }
  throw error
}
