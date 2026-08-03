/**
 * IPX-compatible image URL parsing.
 * @see https://github.com/unjs/ipx — `/w_200,f_webp/{src}` or `/_/{src}`
 */

const IPX_KEY_ALIASES: Record<string, string> = {
  w: 'width',
  h: 'height',
  f: 'format',
  q: 'quality',
  s: 'resize',
  pos: 'position',
  b: 'background',
  a: 'animated',
}

/** Flags that appear without a value in IPX URLs. */
const IPX_FLAG_KEYS = new Set([
  'enlarge',
  'flip',
  'flop',
  'grayscale',
  'normalize',
  'negate',
  'flatten',
  'animated',
  'a',
])

const MODIFIER_SEGMENT_RE = /^(?:_|(?:[a-z]+(?:_[^,/]*)?)(?:,(?:[a-z]+(?:_[^,/]*)?))*)$/i

export function parseIpxOperationsSegment(segment: string): Record<string, string> {
  if (!segment || segment === '_') {
    return {}
  }

  const operations: Record<string, string> = {}
  for (const part of segment.split(',')) {
    if (!part) {
      continue
    }
    const separator = part.indexOf('_')
    if (separator <= 0) {
      if (IPX_FLAG_KEYS.has(part)) {
        const key = IPX_KEY_ALIASES[part] ?? part
        operations[key] = 'true'
      }
      continue
    }
    const rawKey = part.slice(0, separator)
    const value = part.slice(separator + 1)
    const key = IPX_KEY_ALIASES[rawKey] ?? rawKey
    if (key === 'resize') {
      const [w, h] = value.split('x')
      if (w) {
        operations.width = w
      }
      if (h) {
        operations.height = h
      }
      operations.resize = value
      continue
    }
    operations[key] = value
  }
  return operations
}

export function isIpxModifiersSegment(segment: string): boolean {
  if (!segment || segment.includes('/')) {
    return false
  }
  if (segment === '_') {
    return true
  }
  // Filenames with an extension are never modifiers (e.g. photo.webp).
  if (/\.[a-z0-9]+$/i.test(segment) && !segment.includes(',')) {
    return false
  }
  // Real IPX ops always include `_` / `,`, or are a known bare flag (flip, enlarge, …).
  // Plain folders like `uploads` must not match.
  if (!segment.includes('_') && !segment.includes(',')) {
    return IPX_FLAG_KEYS.has(segment)
  }
  return MODIFIER_SEGMENT_RE.test(segment)
}

export function parseIpxImagePath(fullPath: string): {
  assetPath: string
  operations: Record<string, string>
  /** Original modifiers segment (`w_800,f_webp`, `_`, or null when absent). */
  modifiersSegment: string | null
} {
  const normalized = fullPath.replace(/^\/+/, '')
  if (!normalized) {
    return { assetPath: '', operations: {}, modifiersSegment: null }
  }

  const slash = normalized.indexOf('/')
  if (slash <= 0) {
    return { assetPath: normalized, operations: {}, modifiersSegment: null }
  }

  const first = normalized.slice(0, slash)
  const rest = normalized.slice(slash + 1)
  if (!rest || !isIpxModifiersSegment(first)) {
    return { assetPath: normalized, operations: {}, modifiersSegment: null }
  }

  return {
    assetPath: rest,
    operations: parseIpxOperationsSegment(first),
    modifiersSegment: first,
  }
}

export function hasImageTransformOps(operations: Record<string, string>): boolean {
  return Boolean(
    operations.width
    || operations.height
    || operations.format
    || operations.quality
    || operations.fit
    || operations.resize,
  )
}

/** Rebuild an IPX image path from parsed parts. */
export function buildIpxImagePath(
  assetPath: string,
  modifiersSegment: string | null,
): string {
  const path = assetPath.replace(/^\/+/, '')
  if (!modifiersSegment || modifiersSegment === '_') {
    return path
  }
  return `${modifiersSegment}/${path}`
}
