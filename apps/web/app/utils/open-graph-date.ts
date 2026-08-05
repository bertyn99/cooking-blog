const ISO_DATE_TIME
  = /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/

/** ISO 8601 datetime for Open Graph article:* and Twitter meta. */
export function formatOpenGraphDateTime(value?: string | null): string | undefined {
  const raw = value?.trim()
  if (!raw || !ISO_DATE_TIME.test(raw)) {
    return undefined
  }

  const normalized = raw.includes('T') || raw.includes(' ')
    ? raw.replace(' ', 'T')
    : `${raw}T12:00:00.000Z`

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}
