import { createError as h3CreateError } from 'h3'
import { createError as evlogCreateError } from 'evlog'
import { isQueryError, type QueryErrorCode } from '../db/query-errors'
import type { ApiErrorCode } from '../../shared/api-error'

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
}

const FIX_HINTS: Partial<Record<ApiErrorCode, string>> = {
  VALIDATION_ERROR: 'Vérifiez les champs du formulaire.',
  UNAUTHORIZED: 'Reconnectez-vous.',
  FORBIDDEN: 'Vous n’avez pas les droits pour cette action.',
  NOT_FOUND: 'La ressource demandée n’existe pas ou a été supprimée.',
  CONFLICT: 'Cette opération entre en conflit avec l’état actuel.',
}

/**
 * Structured API error: stable `{ error: { code, message, details } }` for clients,
 * plus evlog fields (`why`, `fix`) on the thrown error for observability.
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  options?: {
    status?: number
    why?: string
    fix?: string
    cause?: Error
    internal?: Record<string, unknown>
  }
) {
  const why = options?.why ?? message
  const fix = options?.fix ?? FIX_HINTS[code]
  const statusCode = options?.status ?? STATUS_BY_CODE[code]
  const internal = {
    ...(details === undefined ? {} : { details }),
    ...options?.internal,
  }

  const clientBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      why,
      fix,
    },
  }

  const structured = evlogCreateError({
    code,
    message,
    status: statusCode,
    why,
    fix,
    cause: options?.cause,
    internal: Object.keys(internal).length > 0 ? internal : undefined,
  })

  return h3CreateError({
    statusCode,
    statusMessage: message,
    data: clientBody,
    cause: structured,
  })
}

const queryCodeToApi: Record<QueryErrorCode, ApiErrorCode> = {
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
