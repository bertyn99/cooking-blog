/** Stable API error envelope returned by `createApiError`. */
export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
    why?: string
    fix?: string
  }
}

/** Extract a user-facing message from ofetch / API failures. */
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (error && typeof error === 'object') {
    const fetchLike = error as {
      data?: ApiErrorBody | Record<string, unknown>
      statusMessage?: string
      message?: string
    }
    const payload = fetchLike.data
    if (payload && typeof payload === 'object') {
      const nestedError = 'error' in payload
        && payload.error
        && typeof payload.error === 'object'
        && payload.error !== null
        && 'message' in payload.error
        ? (payload.error as ApiErrorBody['error'])
        : undefined
      if (nestedError?.message) return nestedError.message

      if ('message' in payload && typeof payload.message === 'string' && payload.message) {
        return payload.message
      }

      const inner = 'data' in payload ? payload.data : undefined
      if (inner && typeof inner === 'object' && inner !== null) {
        const record = inner as Record<string, unknown>
        if (typeof record.message === 'string' && record.message) return record.message
        if (typeof record.why === 'string' && record.why) return record.why
      }

      if ('why' in payload && typeof payload.why === 'string' && payload.why) {
        return payload.why
      }
    }
    if (fetchLike.statusMessage) return fetchLike.statusMessage
    if (fetchLike.message) return fetchLike.message
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}
