const NUXT_DIAGNOSTIC_CODE = /^NUXT_[A-Z]\d{4}$/

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value) => typeof value === 'string' && value.length > 0) as string | undefined
}

/**
 * Extract Nuxt diagnostic codes and application/API error codes from either
 * an Error instance or a serialized Nuxt/ofetch error response.
 */
export function getErrorCode(error: unknown): string | undefined {
  const record = asRecord(error)
  if (!record) return undefined

  const data = asRecord(record.data)
  const nestedData = asRecord(data?.data)
  const nestedError = asRecord(data?.error)
  const payloadCode = firstString(data?.code, nestedData?.code, nestedError?.code)
  if (payloadCode) return payloadCode

  const directCode = firstString(record.code)
  if (directCode) return directCode

  const name = record.name
  return typeof name === 'string' && NUXT_DIAGNOSTIC_CODE.test(name) ? name : undefined
}
