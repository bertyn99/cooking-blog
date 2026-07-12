import { createError as h3CreateError } from 'h3'

/**
 * Creates a consistent API error using H3's native createError.
 * Named createApiError to avoid shadowing H3's built-in.
 */
export function createApiError(
  code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR',
  message: string,
  details?: unknown,
) {
  const statusMap = {
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_ERROR: 500,
  }
  return h3CreateError({
    statusCode: statusMap[code],
    statusMessage: message,
    data: { error: { code, message, details } },
  })
}
