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
})
