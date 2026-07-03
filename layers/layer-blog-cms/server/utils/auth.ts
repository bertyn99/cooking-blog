/**
 * Authentication utilities — Web Crypto API only (Workers-compatible).
 *
 * Password storage format: `pbkdf2:100000:sha256:{base64-salt}:{base64-hash}`
 * JWT algorithm: HS256 (HMAC-SHA256), expiration 1 hour.
 *
 * Note: Web Crypto (`crypto.subtle`) is async-only, so `signJwt` returns
 * `Promise<string>` and `verifyJwt` returns `Promise<JwtPayload | null>`.
 */
import { createApiError } from './errors'

// --- Constants ----------------------------------------------------------

const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH = 'SHA-256'
const PBKDF2_KEY_LEN = 32 // 256 bits
const SALT_LEN = 16 // 128 bits
const JWT_ALG = 'HS256'
const JWT_TTL_SECONDS = 3600 // 1 hour

const TEXT_ENCODER = new TextEncoder()

// --- Types --------------------------------------------------------------

export type UserRole = 'admin' | 'editor'

/** User row as stored in the database (includes passwordHash). */
export interface DbUser {
  id: number
  email: string
  username: string | null
  passwordHash: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

/** Safe user object returned by every API response (no passwordHash). */
export interface SafeUser {
  id: number
  email: string
  username: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

/** JWT payload structure. */
export interface JwtPayload {
  sub: number // user id
  email: string
  role: UserRole
  iat: number // issued at (unix seconds)
  exp: number // expiration (unix seconds)
}

// --- Helpers ------------------------------------------------------------

function assertJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw createApiError(
      'INTERNAL_ERROR',
      'JWT_SECRET environment variable is not configured'
    )
  }
  return secret
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bufferToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return atob(padded + pad)
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// --- Password hashing ---------------------------------------------------

/**
 * Hashes a password using PBKDF2 with SHA-256 and 100,000 iterations.
 * Returns a self-describing string: `pbkdf2:100000:sha256:{salt}:{hash}`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    keyMaterial,
    PBKDF2_KEY_LEN * 8
  )
  const saltB64 = bufferToBase64(salt)
  const hashB64 = bufferToBase64(derivedBits)
  return `pbkdf2:${PBKDF2_ITERATIONS}:sha256:${saltB64}:${hashB64}`
}

/**
 * Verifies a plaintext password against a stored hash string.
 * Supports the `pbkdf2:iterations:sha256:salt:hash` format produced by hashPassword.
 * Returns false if the stored format is unrecognized (no throw on mismatch).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  // Format: pbkdf2:iterations:sha256:salt:hash
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false
  const [, iterStr, hashName, saltB64, hashB64] = parts
  const iterations = parseInt(iterStr!, 10)
  if (!Number.isFinite(iterations) || iterations <= 0) return false

  let salt: Uint8Array
  let expected: Uint8Array
  try {
    salt = base64ToBuffer(saltB64!)
    expected = base64ToBuffer(hashB64!)
  } catch {
    return false
  }

  // Only sha256 is supported by this implementation.
  if (hashName !== 'sha256') return false

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: PBKDF2_HASH
    },
    keyMaterial,
    expected.length * 8
  )

  // Constant-time-ish comparison.
  const actual = new Uint8Array(derivedBits)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual[i]! ^ expected[i]!
  }
  return diff === 0
}

// --- JWT ----------------------------------------------------------------

/**
 * Signs a JWT (HS256) containing the user's id, email, and role.
 * Expiration is 1 hour from now (`exp = floor(now/1000) + 3600`).
 *
 * Web Crypto is async-only, so this returns `Promise<string>`.
 */
export async function signJwt(payload: {
  sub: number
  email: string
  role: UserRole
}): Promise<string> {
  const secret = assertJwtSecret()
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    iat: now,
    exp: now + JWT_TTL_SECONDS
  }

  const headerBytes = TEXT_ENCODER.encode(JSON.stringify({ alg: JWT_ALG, typ: 'JWT' }))
  const payloadBytes = TEXT_ENCODER.encode(JSON.stringify(fullPayload))
  const headerEncoded = base64UrlEncode(headerBytes)
  const payloadEncoded = base64UrlEncode(payloadBytes)
  const signingInput = `${headerEncoded}.${payloadEncoded}`
  const signingInputBytes = TEXT_ENCODER.encode(signingInput)

  const key = await importHmacKey(secret)
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, signingInputBytes)
  )
  const sigEncoded = base64UrlEncode(sigBytes)
  return `${signingInput}.${sigEncoded}`
}

/**
 * Verifies a JWT (HS256) signature and expiration.
 * Returns the decoded payload if valid and not expired, otherwise null.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  const secret = assertJwtSecret()
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerEncoded, payloadEncoded, sigEncoded] = parts as [string, string, string]
  if (!headerEncoded || !payloadEncoded || !sigEncoded) return null

  // Validate header
  let header: { alg?: string, typ?: string }
  try {
    header = JSON.parse(base64UrlDecodeToString(headerEncoded))
  } catch {
    return null
  }
  if (header.alg !== JWT_ALG) return null

  // Decode payload
  let payload: JwtPayload
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadEncoded))
  } catch {
    return null
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || now >= payload.exp) return null

  // Verify signature (constant-time via Web Crypto)
  const key = await importHmacKey(secret)
  const signingInput = `${headerEncoded}.${payloadEncoded}`
  let sigBytes: Uint8Array
  try {
    sigBytes = base64UrlDecodeToBytes(sigEncoded)
  } catch {
    return null
  }
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as BufferSource,
    TEXT_ENCODER.encode(signingInput)
  )
  if (!valid) return null
  return payload
}

// --- Sanitization -------------------------------------------------------

/**
 * Strips sensitive fields (passwordHash) from a user object.
 * Returns a SafeUser suitable for API responses.
 */
export function sanitizeUser(user: DbUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

// --- Token extraction ---------------------------------------------------

/**
 * Extracts a Bearer token from the Authorization header value.
 * Returns the token string or null if absent/malformed.
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  return match ? match[1]! : null
}
