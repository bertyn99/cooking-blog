import { describe, expect, it } from 'vitest'
import { createRequestRateLimiter, type RateLimitStore } from '../../server/utils/rate-limit'

function memoryStore(): RateLimitStore {
  const data = new Map<string, { value: unknown, expiresAt?: number }>()
  return {
    async get<T>(key: string) {
      const entry = data.get(key)
      if (!entry) return null
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        data.delete(key)
        return null
      }
      return entry.value as T
    },
    async set(key, value, opts) {
      data.set(key, {
        value,
        expiresAt: opts?.ttl ? Date.now() + opts.ttl * 1000 : undefined,
      })
    },
    async del(key) {
      data.delete(key)
    },
  }
}

describe('createRequestRateLimiter', () => {
  it('allows requests under the limit', async () => {
    const limiter = createRequestRateLimiter(memoryStore(), {
      prefix: 'test:img',
      maxRequests: 3,
      windowSeconds: 60,
    })
    expect(await limiter.consume('1.2.3.4')).toMatchObject({ allowed: true, current: 1 })
    expect(await limiter.consume('1.2.3.4')).toMatchObject({ allowed: true, current: 2 })
    expect(await limiter.consume('1.2.3.4')).toMatchObject({ allowed: true, current: 3 })
  })

  it('blocks when the window is exhausted', async () => {
    const limiter = createRequestRateLimiter(memoryStore(), {
      prefix: 'test:img',
      maxRequests: 2,
      windowSeconds: 60,
    })
    await limiter.consume('9.9.9.9')
    await limiter.consume('9.9.9.9')
    expect(await limiter.consume('9.9.9.9')).toMatchObject({ allowed: false, current: 2 })
  })

  it('resets the count when the window elapses (no permanent block)', async () => {
    const limiter = createRequestRateLimiter(memoryStore(), {
      prefix: 'test:img',
      maxRequests: 2,
      windowSeconds: 60,
    })
    await limiter.consume('8.8.8.8')
    await limiter.consume('8.8.8.8')
    expect(await limiter.consume('8.8.8.8')).toMatchObject({ allowed: false })

    // Simulate the window elapsing without the store TTL expiring (D1 store
    // ignores TTLs — regression guard for the permanent-429 prod incident).
    const store = memoryStore()
    const limiter2 = createRequestRateLimiter(store, {
      prefix: 'test:img',
      maxRequests: 2,
      windowSeconds: 60,
    })
    await limiter2.consume('7.7.7.7')
    await limiter2.consume('7.7.7.7')
    const stored = await store.get<{ count: number, windowStart: number }>('test:img:7.7.7.7')
    expect(stored && typeof stored === 'object' && 'windowStart' in stored).toBe(true)
    await store.set('test:img:7.7.7.7', { count: 2, windowStart: Date.now() - 61_000 })
    expect(await limiter2.consume('7.7.7.7')).toMatchObject({ allowed: true, current: 1 })
  })

  it('keeps counting legacy numeric entries but starts a fresh window', async () => {
    const store = memoryStore()
    await store.set('test:img:6.6.6.6', 120 as unknown as never)
    const limiter = createRequestRateLimiter(store, {
      prefix: 'test:img',
      maxRequests: 120,
      windowSeconds: 60,
    })
    // Still blocked for this request — the fresh window just started…
    expect(await limiter.consume('6.6.6.6')).toMatchObject({ allowed: false, current: 120 })
    // …but the tally is migrated to the windowed shape, so it expires after
    // one window instead of blocking forever.
    const stored = await store.get<{ count: number, windowStart: number }>('test:img:6.6.6.6')
    expect(stored && typeof stored === 'object' && 'windowStart' in stored).toBe(true)
    await store.set('test:img:6.6.6.6', { count: 120, windowStart: Date.now() - 61_000 })
    expect(await limiter.consume('6.6.6.6')).toMatchObject({ allowed: true, current: 1 })
  })
})
