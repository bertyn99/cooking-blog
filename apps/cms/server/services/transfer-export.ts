import { createApiError } from '../utils/errors'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export function parseTransferPage(query: Record<string, unknown>) {
  const rawLimit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
    : DEFAULT_LIMIT

  let cursor: number | null = null
  if (typeof query.cursor === 'string' && query.cursor.trim()) {
    const parsed = Number.parseInt(query.cursor, 10)
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw createApiError('VALIDATION_ERROR', 'Curseur invalide.')
    }
    cursor = parsed
  }

  return { limit, cursor }
}

export function parseMediaTransferPage(query: Record<string, unknown>) {
  const rawLimit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
    : DEFAULT_LIMIT

  const cursor = typeof query.cursor === 'string' && query.cursor.trim()
    ? query.cursor.trim()
    : null

  return { limit, cursor }
}
