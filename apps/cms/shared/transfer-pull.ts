import { API_KEY_SCOPES, normalizeApiKeyScopes, type ApiKeyScope } from './api-keys'

export const TRANSFER_PULL_CONFIRM_PHRASE = 'IMPORTER'

const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.localhost'] as const

function isIpv4OctetPrivate(host: string): boolean {
  const parts = host.split('.').map(part => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) {
    return false
  }
  const [a, b] = parts as [number, number, number, number]
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  // Carrier-grade NAT
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

export function isPrivateHostname(host: string): boolean {
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    normalized === 'localhost'
    || normalized === '0.0.0.0'
    || normalized === '::1'
    || normalized === 'metadata'
    || normalized === 'metadata.google.internal'
  ) {
    return true
  }
  if (BLOCKED_HOST_SUFFIXES.some(suffix => normalized.endsWith(suffix))) {
    return true
  }
  if (normalized.includes(':')) {
    // IPv4-mapped / IPv4-compatible IPv6 → evaluate the embedded IPv4 address.
    // WHATWG may normalize [::ffff:127.0.0.1] to [::ffff:7f00:1].
    const mappedHex = normalized.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
    if (mappedHex) {
      const high = Number.parseInt(mappedHex[1]!, 16)
      const low = Number.parseInt(mappedHex[2]!, 16)
      const ipv4 = [high >> 8, high & 0xFF, low >> 8, low & 0xFF].join('.')
      return isIpv4OctetPrivate(ipv4)
    }
    const mappedDotted = normalized.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/i)
    if (mappedDotted) return isIpv4OctetPrivate(mappedDotted[1]!)

    // IPv6 unique-local / link-local
    return (
      normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe80')
      || normalized === '::'
    )
  }
  return isIpv4OctetPrivate(normalized)
}

export function normalizeCmsOrigin(
  raw: string,
  options?: { allowPrivate?: boolean },
): string {
  const trimmed = raw.trim().replace(/\/$/, '')
  if (!trimmed) {
    throw new Error('ORIGIN_REQUIRED')
  }
  let url: URL
  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
  }
  catch {
    throw new Error('ORIGIN_INVALID')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('ORIGIN_INVALID')
  }
  if (url.username || url.password) {
    throw new Error('ORIGIN_INVALID')
  }
  if (isPrivateHostname(url.hostname) && !options?.allowPrivate) {
    throw new Error('ORIGIN_PRIVATE')
  }
  return url.origin
}

export function parseTransferPullInput(
  body: unknown,
  options?: { allowPrivateOrigin?: boolean },
): {
  origin: string
  apiKey: string
  scopes: ApiKeyScope[]
  dryRun: boolean
  limit: number
  confirm: string
} {
  const record = (body && typeof body === 'object') ? body as Record<string, unknown> : {}
  const originRaw = typeof record.origin === 'string' ? record.origin : ''
  const apiKey = typeof record.apiKey === 'string' ? record.apiKey.trim() : ''
  const scopes = normalizeApiKeyScopes(record.scopes)
  const dryRun = record.dryRun === true || record.dryRun === 'true' || record.dryRun === 1
  const confirm = typeof record.confirm === 'string' ? record.confirm.trim() : ''
  const rawLimit = Number.parseInt(String(record.limit ?? 50), 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, rawLimit)) : 50

  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED')
  }
  if (scopes.length === 0) {
    throw new Error('SCOPES_REQUIRED')
  }

  const origin = normalizeCmsOrigin(originRaw, { allowPrivate: options?.allowPrivateOrigin })
  return { origin, apiKey, scopes, dryRun, limit, confirm }
}

export { API_KEY_SCOPES }
