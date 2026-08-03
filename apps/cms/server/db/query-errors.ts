export type QueryErrorCode = 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR'

export class QueryError extends Error {
  readonly code: QueryErrorCode
  readonly details?: unknown

  constructor(code: QueryErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'QueryError'
    this.code = code
    this.details = details
  }
}

export function queryNotFound(message: string, details?: unknown): QueryError {
  return new QueryError('NOT_FOUND', message, details)
}

export function queryValidation(message: string, details?: unknown): QueryError {
  return new QueryError('VALIDATION_ERROR', message, details)
}

export function queryConflict(message: string, details?: unknown): QueryError {
  return new QueryError('CONFLICT', message, details)
}

export function queryInternal(message: string, details?: unknown): QueryError {
  return new QueryError('INTERNAL_ERROR', message, details)
}

export function isQueryError(error: unknown): error is QueryError {
  return error instanceof QueryError
}
