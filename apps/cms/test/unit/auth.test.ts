/**
 * Unit tests for the authentication system (T6).
 *
 * Covers:
 *  - PBKDF2 password hashing & verification (Web Crypto)
 *  - JWT signing & verification with HMAC-SHA256 + 1h expiration
 *  - sanitizeUser strips passwordHash
 *  - extractBearerToken parses Authorization header
 *  - Rate-limiting logic (mock in-memory KV)
 *  - RBAC requireRole (mock H3Event)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractBearerToken,
  hashPassword,
  sanitizeUser,
  signJwt,
  verifyJwt,
  verifyPassword,
  type DbUser
} from '../../server/utils/auth'
import { createRateLimiter, type RateLimitStore } from '../../server/utils/rate-limit'
import { requireRole } from '../../server/utils/rbac'

// --- Test setup --------------------------------------------------------

const JWT_SECRET = 'test-secret-please-do-not-use-in-production-32-chars-min'
const ORIGINAL_SECRET = process.env.JWT_SECRET

beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET
})

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = ORIGINAL_SECRET
  vi.restoreAllMocks()
})

// --- In-memory KV mock -------------------------------------------------

function createMockKv(): RateLimitStore & { _store: Map<string, unknown> } {
  const store = new Map<string, unknown>()
  return {
    _store: store,
    async get<T = unknown>(key: string): Promise<T | null> {
      return (store.get(key) as T) ?? null
    },
    async set(key: string, value: unknown): Promise<void> {
      store.set(key, value)
    },
    async del(key: string): Promise<void> {
      store.delete(key)
    }
  }
}

// =========================================================================
// Password hashing
// =========================================================================

describe('hashPassword / verifyPassword', () => {
  it('hashPassword produces a pbkdf2:100000:sha256:salt:hash string', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash).toMatch(/^pbkdf2:100000:sha256:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/)
  })

  it('verifyPassword accepts the correct password', async () => {
    const password = 'S3cure-P@ssw0rd!'
    const hash = await hashPassword(password)
    expect(await verifyPassword(password, hash)).toBe(true)
  })

  it('verifyPassword rejects an incorrect password', async () => {
    const hash = await hashPassword('the-right-one')
    expect(await verifyPassword('the-wrong-one', hash)).toBe(false)
  })

  it('verifyPassword is case-sensitive', async () => {
    const hash = await hashPassword('MixedCase123')
    expect(await verifyPassword('mixedcase123', hash)).toBe(false)
  })

  it('hashPassword uses a fresh random salt each call (no two hashes equal)', async () => {
    const a = await hashPassword('samepassword')
    const b = await hashPassword('samepassword')
    expect(a).not.toBe(b)
    // ...but both verify the same plaintext.
    expect(await verifyPassword('samepassword', a)).toBe(true)
    expect(await verifyPassword('samepassword', b)).toBe(true)
  })

  it('verifyPassword returns false for malformed stored strings', async () => {
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false)
    expect(await verifyPassword('x', 'argon2:100:memory:salt:hash')).toBe(false)
    expect(await verifyPassword('x', 'pbkdf2:abc:notsha:salt:hash')).toBe(false) // non-numeric iter
    expect(await verifyPassword('x', 'pbkdf2:100000:md5:salt:hash')).toBe(false) // unsupported hash
    expect(await verifyPassword('x', 'pbkdf2:100000:sha256:!!!:hash')).toBe(false) // bad base64
  })
})

// =========================================================================
// JWT
// =========================================================================

describe('signJwt / verifyJwt', () => {
  it('signs and verifies a valid token', async () => {
    const token = await signJwt({ sub: 42, email: 'a@b.co', role: 'admin' })
    expect(typeof token).toBe('string')
    const parts = token.split('.')
    expect(parts).toHaveLength(3)

    const payload = await verifyJwt(token)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe(42)
    expect(payload?.email).toBe('a@b.co')
    expect(payload?.role).toBe('admin')
    expect(payload?.iat).toBeTypeOf('number')
    expect(payload?.exp).toBeTypeOf('number')
  })

  it('sets exp exactly 3600 seconds (1 hour) after iat', async () => {
    const token = await signJwt({ sub: 1, email: 'x@y.z', role: 'editor' })
    const payload = await verifyJwt(token)
    expect(payload!.exp - payload!.iat).toBe(3600)
  })

  it('rejects a tampered payload (signature mismatch)', async () => {
    const token = await signJwt({ sub: 1, email: 'a@b.co', role: 'admin' })
    // Flip the role claim in the payload section.
    const [header, payloadB64, sig] = token.split('.')
    const tamperedPayload = btoa(
      JSON.stringify({ ...JSON.parse(atob(payloadB64!)), role: 'editor' })
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const tampered = `${header}.${tamperedPayload}.${sig}`
    expect(await verifyJwt(tampered)).toBeNull()
  })

  it('rejects a tampered signature', async () => {
    const token = await signJwt({ sub: 1, email: 'a@b.co', role: 'admin' })
    const [header, payload] = token.split('.')
    const forgedSig = btoa('not-the-real-signature-just-garbage-bytes-!!')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(await verifyJwt(`${header}.${payload}.${forgedSig}`)).toBeNull()
  })

  it('rejects a token signed with a different secret', async () => {
    process.env.JWT_SECRET = 'first-secret'
    const token = await signJwt({ sub: 1, email: 'a@b.co', role: 'admin' })
    process.env.JWT_SECRET = 'second-secret'
    expect(await verifyJwt(token)).toBeNull()
  })

  it('rejects a token with an expired `exp`', async () => {
    // Build a token manually with exp in the past.
    const { signJwt: _signJwt } = await import('../../server/utils/auth')
    const now = Math.floor(Date.now() / 1000)
    const expiredPayload = {
      sub: 1,
      email: 'a@b.co',
      role: 'admin' as const,
      iat: now - 7200,
      exp: now - 3600 // expired 1h ago
    }
    // Re-implement minimal signing inline to forge an expired (but signed) token.
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const b64url = (bytes: Uint8Array) =>
      btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
    const body = b64url(enc.encode(JSON.stringify(expiredPayload)))
    const sig = b64url(
      new Uint8Array(
        await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
      )
    )
    const forgedExpiredToken = `${header}.${body}.${sig}`
    void _signJwt // silence unused
    expect(await verifyJwt(forgedExpiredToken)).toBeNull()
  })

  it('rejects garbage inputs without throwing', async () => {
    expect(await verifyJwt('')).toBeNull()
    expect(await verifyJwt('not-a-jwt')).toBeNull()
    expect(await verifyJwt('a.b')).toBeNull()
    expect(await verifyJwt('a.b.c.d')).toBeNull()
  })

  it('rejects tokens with unsupported alg', async () => {
    // Forge a token with alg=none
    const enc = new TextEncoder()
    const b64url = (bytes: Uint8Array) =>
      btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    const header = b64url(enc.encode(JSON.stringify({ alg: 'none', typ: 'JWT' })))
    const body = b64url(
      enc.encode(JSON.stringify({ sub: 1, email: 'a@b.co', role: 'admin', iat: 0, exp: 9999999999 }))
    )
    expect(await verifyJwt(`${header}.${body}.`)).toBeNull()
  })

  it('throws when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET
    await expect(
      signJwt({ sub: 1, email: 'a@b.co', role: 'admin' })
    ).rejects.toThrow(/JWT_SECRET/)
    await expect(verifyJwt('a.b.c')).rejects.toThrow(/JWT_SECRET/)
  })
})

// =========================================================================
// sanitizeUser
// =========================================================================

describe('sanitizeUser', () => {
  const fullUser: DbUser = {
    id: 7,
    email: 'chef@journalducuistot.fr',
    username: 'lecuistot',
    passwordHash: 'pbkdf2:100000:sha256:salt:hash',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-23T12:00:00.000Z'
  }

  it('strips passwordHash', () => {
    const safe = sanitizeUser(fullUser)
    expect(safe).not.toHaveProperty('passwordHash')
    expect(JSON.stringify(safe)).not.toContain('passwordHash')
    expect(JSON.stringify(safe)).not.toContain('pbkdf2')
  })

  it('preserves expected fields', () => {
    expect(sanitizeUser(fullUser)).toEqual({
      id: 7,
      email: 'chef@journalducuistot.fr',
      username: 'lecuistot',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-06-23T12:00:00.000Z'
    })
  })

  it('handles editor role and null username', () => {
    const editor: DbUser = { ...fullUser, id: 99, role: 'editor', username: null }
    const safe = sanitizeUser(editor)
    expect(safe.role).toBe('editor')
    expect(safe.username).toBeNull()
    expect(safe.id).toBe(99)
  })
})

// =========================================================================
// extractBearerToken
// =========================================================================

describe('extractBearerToken', () => {
  it('parses a Bearer token', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('is case-insensitive on the scheme', () => {
    expect(extractBearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi')
    expect(extractBearerToken('BEARER abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('tolerates extra whitespace', () => {
    expect(extractBearerToken('  Bearer   abc.def.ghi  ')).toBe('abc.def.ghi')
  })

  it('returns null for missing header', () => {
    expect(extractBearerToken(null)).toBeNull()
    expect(extractBearerToken(undefined)).toBeNull()
    expect(extractBearerToken('')).toBeNull()
  })

  it('returns null for non-Bearer schemes', () => {
    expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull()
    expect(extractBearerToken('abc.def.ghi')).toBeNull()
  })
})

// =========================================================================
// Rate limiting (mock KV)
// =========================================================================

describe('createRateLimiter (KV-based rate limiting)', () => {
  it('starts unblocked with zero failures', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 5,
      windowSeconds: 900
    })
    const status = await limiter.check('1.2.3.4')
    expect(status.blocked).toBe(false)
    expect(status.current).toBe(0)
    expect(status.remaining).toBe(5)
  })

  it('blocks after reaching maxFailures', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 5,
      windowSeconds: 900
    })
    for (let i = 0; i < 5; i++) {
      await limiter.increment('10.0.0.1')
    }
    const status = await limiter.check('10.0.0.1')
    expect(status.current).toBe(5)
    expect(status.blocked).toBe(true)
    expect(status.remaining).toBe(0)
  })

  it('does NOT block before reaching maxFailures (4 → unblocked)', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 5,
      windowSeconds: 900
    })
    for (let i = 0; i < 4; i++) {
      await limiter.increment('10.0.0.2')
    }
    const status = await limiter.check('10.0.0.2')
    expect(status.current).toBe(4)
    expect(status.blocked).toBe(false)
    expect(status.remaining).toBe(1)
  })

  it('counts are independent per IP', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 3,
      windowSeconds: 60
    })
    await limiter.increment('a')
    await limiter.increment('a')
    await limiter.increment('b')
    expect((await limiter.check('a')).current).toBe(2)
    expect((await limiter.check('b')).current).toBe(1)
    expect((await limiter.check('c')).current).toBe(0)
  })

  it('reset clears the counter', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 5,
      windowSeconds: 900
    })
    for (let i = 0; i < 5; i++) await limiter.increment('1.1.1.1')
    expect((await limiter.check('1.1.1.1')).blocked).toBe(true)
    await limiter.reset('1.1.1.1')
    const status = await limiter.check('1.1.1.1')
    expect(status.blocked).toBe(false)
    expect(status.current).toBe(0)
    expect(status.remaining).toBe(5)
  })

  it('uses the configured prefix for KV keys', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 3,
      windowSeconds: 60
    })
    await limiter.increment('9.9.9.9')
    expect(kv._store.has('login:fail:9.9.9.9')).toBe(true)
    expect(kv._store.get('login:fail:9.9.9.9')).toBe(1)
  })

  it('set is called with TTL matching windowSeconds', async () => {
    const kv = createMockKv()
    const setSpy = vi.spyOn(kv, 'set')
    const limiter = createRateLimiter(kv, {
      prefix: 'rl',
      maxFailures: 2,
      windowSeconds: 1234
    })
    await limiter.increment('id')
    expect(setSpy).toHaveBeenCalledWith('rl:id', 1, { ttl: 1234 })
  })

  it('handles getCount for never-seen IDs as zero', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'rl',
      maxFailures: 2,
      windowSeconds: 60
    })
    expect(await limiter.getCount('never-seen')).toBe(0)
  })

  it('returns correct remaining when maxFailures is 1', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'rl',
      maxFailures: 1,
      windowSeconds: 60
    })
    expect((await limiter.check('x')).remaining).toBe(1)
    expect((await limiter.check('x')).blocked).toBe(false)
    await limiter.increment('x')
    const status = await limiter.check('x')
    expect(status.blocked).toBe(true)
    expect(status.remaining).toBe(0)
  })
})

// =========================================================================
// RBAC requireRole (mock H3Event)
// =========================================================================

describe('requireRole', () => {
  function mockEvent(user: unknown) {
    return { context: { user } } as unknown as Parameters<typeof requireRole>[0]
  }

  it('allows when role is in the list', () => {
    const event = mockEvent({ sub: 1, email: 'a@b.co', role: 'admin', iat: 0, exp: 9999999999 })
    expect(() => requireRole(event, ['admin'])).not.toThrow()
    expect(() => requireRole(event, ['admin', 'editor'])).not.toThrow()
  })

  it('throws 403 when role is not in the list', () => {
    const event = mockEvent({
      sub: 1,
      email: 'a@b.co',
      role: 'editor',
      iat: 0,
      exp: 9999999999
    })
    expect(() => requireRole(event, ['admin'])).toThrow()
    try {
      requireRole(event, ['admin'])
    } catch (err) {
      const e = err as { statusCode?: number, statusMessage?: string }
      expect(e.statusCode).toBe(403)
      expect(e.statusMessage).toMatch(/not permitted/i)
    }
  })

  it('throws 401 when no user on context', () => {
    const event = mockEvent(undefined)
    expect(() => requireRole(event, ['admin'])).toThrow()
    try {
      requireRole(event, ['admin'])
    } catch (err) {
      const e = err as { statusCode?: number }
      expect(e.statusCode).toBe(401)
    }
  })

  it('editor can pass editor-only guard', () => {
    const event = mockEvent({
      sub: 1,
      email: 'a@b.co',
      role: 'editor',
      iat: 0,
      exp: 9999999999
    })
    expect(() => requireRole(event, ['editor'])).not.toThrow()
  })
})
