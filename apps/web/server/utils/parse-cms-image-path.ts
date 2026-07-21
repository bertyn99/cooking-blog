/** Parse `/images/{ops}/uploads/...` paths from `localImageSharp` provider. */
export function parseImageOperationsSegment(segment: string): Record<string, string> {
  const operations: Record<string, string> = {}
  for (const part of segment.split(',')) {
    const separator = part.indexOf('_')
    if (separator <= 0) {
      continue
    }
    operations[part.slice(0, separator)] = part.slice(separator + 1)
  }
  return operations
}

export function parseCmsImagePath(fullPath: string): {
  assetPath: string
  operations: Record<string, string>
} {
  const normalized = fullPath.replace(/^\/+/, '')
  const uploadsIndex = normalized.indexOf('uploads/')
  if (uploadsIndex === -1) {
    return { assetPath: normalized, operations: {} }
  }

  const assetPath = normalized.slice(uploadsIndex)
  if (uploadsIndex === 0) {
    return { assetPath, operations: {} }
  }

  const opsSegment = normalized.slice(0, uploadsIndex - 1)
  return {
    assetPath,
    operations: parseImageOperationsSegment(opsSegment),
  }
}

export function hasImageTransformOps(operations: Record<string, string>): boolean {
  return Boolean(
    operations.width
    || operations.height
    || operations.format
    || operations.quality
    || operations.fit,
  )
}
