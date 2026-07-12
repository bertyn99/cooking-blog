import type { ZodSchema } from 'zod'
import { createApiError } from './errors'
import { parsePagination } from './pagination'
import { parseInclude } from './populate'

/**
 * Validates request body against a Zod schema.
 * Throws VALIDATION_ERROR on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      result.error.flatten(),
    )
  }
  return result.data
}

/**
 * Validates query parameters.
 * Returns sanitized values.
 */
export function validateQuery(
  params: Record<string, any>,
  allowedIncludes: string[],
): { include: string[]; page: number; pageSize: number } {
  const includeList = parseInclude(params)
  // Validate include against allowlist
  if (!includeList.includes('*')) {
    const invalid = includeList.filter(r => !allowedIncludes.includes(r))
    if (invalid.length) {
      throw createApiError('VALIDATION_ERROR', `Invalid includes: ${invalid.join(', ')}`)
    }
  }

  const pagination = parsePagination(params)
  return { include: includeList, ...pagination }
}
