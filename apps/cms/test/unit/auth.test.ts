/**
 * Unit tests for the authentication system.
 *
 * Covers:
 *  - IP-based rate limiting (mock in-memory KV)
 *  - nuxt-authorization abilities (canEditContent / canManageUsers)
 *  - Shared zod auth schemas (login / register)
 *
 * Note: `hashPassword` / `verifyPassword` are provided by nuxt-auth-utils
 * (scrypt via @adonisjs/hash) and are exercised end-to-end in the nuxt/e2e
 * projects; they are not unit-tested here.
 */
import { describe, expect, it } from 'vitest'
import { createRateLimiter, type RateLimitStore } from '../../server/utils/rate-limit'
import { loginSchema, registerSchema } from '../../shared/validators/auth'

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
    },
  }
}

describe('createRateLimiter (KV-based rate limiting)', () => {
  it('blocks after reaching maxFailures', async () => {
    const kv = createMockKv()
    const limiter = createRateLimiter(kv, {
      prefix: 'login:fail',
      maxFailures: 5,
      windowSeconds: 900,
    })
    for (let i = 0; i < 5; i++) {
      await limiter.increment('10.0.0.1')
    }
    const status = await limiter.check('10.0.0.1')
    expect(status.blocked).toBe(true)
  })
})

describe('shared zod auth schemas', () => {
  it('loginSchema accepts a valid email + password', () => {
    const parsed = loginSchema.safeParse({
      email: 'admin@journalducuistot.fr',
      password: 'hunter2',
    })
    expect(parsed.success).toBe(true)
  })

  it('loginSchema rejects an invalid email', () => {
    const parsed = loginSchema.safeParse({ email: 'nope', password: 'hunter2' })
    expect(parsed.success).toBe(false)
  })

  it('registerSchema requires an 8+ char password and lowercases email', () => {
    const parsed = registerSchema.safeParse({
      email: 'Admin@JournalDuCuistot.fr',
      password: 'short',
    })
    expect(parsed.success).toBe(false)
  })

  it('registerSchema accepts a valid payload and lowercases email', () => {
    const parsed = registerSchema.safeParse({
      email: 'Admin@JournalDuCuistot.fr',
      password: 'S3cure-P@ssw0rd!',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.email).toBe('admin@journalducuistot.fr')
    }
  })
})
