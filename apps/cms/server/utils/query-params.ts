export const MAX_CSV_VALUES = 50

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === '1') return true
  if (value === false || value === 'false' || value === '0') return false
  return undefined
}

export function parseCsvParam(value: unknown, max = MAX_CSV_VALUES): string[] | undefined {
  const parts: string[] = []

  const push = (item: unknown) => {
    if (item == null || item === '') return
    for (const piece of String(item).split(',')) {
      if (parts.length >= max) return
      const trimmed = piece.trim()
      if (trimmed) parts.push(trimmed)
    }
  }

  if (Array.isArray(value)) {
    value.forEach(push)
  }
  else {
    push(value)
  }

  return parts.length ? parts : undefined
}
