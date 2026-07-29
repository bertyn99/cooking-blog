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
      data?: ApiErrorBody | { message?: string, why?: string, code?: string }
      statusMessage?: string
      message?: string
    }
    const nested = fetchLike.data && 'error' in fetchLike.data
      ? fetchLike.data.error
      : undefined
    if (nested?.message) return nested.message
    const flat = fetchLike.data
    if (flat && 'message' in flat && typeof flat.message === 'string' && flat.message) {
      return flat.message
    }
    if (flat && 'why' in flat && typeof flat.why === 'string' && flat.why) {
      return flat.why
    }
    if (fetchLike.statusMessage) return fetchLike.statusMessage
    if (fetchLike.message) return fetchLike.message
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}
