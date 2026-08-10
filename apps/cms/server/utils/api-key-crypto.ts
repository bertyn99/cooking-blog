import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ApiKeyScope } from '../../shared/api-keys'
import { normalizeApiKeyScopes } from '../../shared/api-keys'

const KEY_BYTES = 32
const PREFIX_VISIBLE = 12

function pepper(): string {
  return (
    process.env.CMS_API_KEY_PEPPER?.trim()
    || process.env.NUXT_SESSION_PASSWORD?.trim()
    || 'dev-insecure-api-key-pepper'
  )
}

export function hashApiKeySecret(secret: string): string {
  return createHash('sha256').update(`${pepper()}:${secret}`).digest('hex')
}

export function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function generateApiKeySecret(): { secret: string, keyPrefix: string, keyHash: string } {
  const raw = randomBytes(KEY_BYTES).toString('base64url')
  const secret = `jdc_${raw}`
  return {
    secret,
    keyPrefix: secret.slice(0, PREFIX_VISIBLE),
    keyHash: hashApiKeySecret(secret),
  }
}

export function parseBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  return token || null
}

export function parseCreateApiKeyBody(body: unknown): {
  name: string
  scopes: ApiKeyScope[]
  expiresAt: string | null
} {
  const record = (body && typeof body === 'object') ? body as Record<string, unknown> : {}
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const scopes = normalizeApiKeyScopes(record.scopes)
  let expiresAt: string | null = null
  if (typeof record.expiresAt === 'string' && record.expiresAt.trim()) {
    const parsed = new Date(record.expiresAt)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('INVALID_EXPIRES_AT')
    }
    expiresAt = parsed.toISOString()
  }
  return { name, scopes, expiresAt }
}

export function isApiKeyExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false
  const when = new Date(expiresAt)
  if (Number.isNaN(when.getTime())) return true
  return when.getTime() <= now.getTime()
}

export function toPublicApiKey(row: {
  id: number
  name: string
  keyPrefix: string
  scopes: ApiKeyScope[] | unknown
  createdByUserId: number | null
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  lastUsedIp: string | null
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.keyPrefix,
    scopes: normalizeApiKeyScopes(row.scopes),
    createdByUserId: row.createdByUserId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    lastUsedAt: row.lastUsedAt,
    lastUsedIp: row.lastUsedIp,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
