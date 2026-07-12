/**
 * Rate-limiting primitives — pure functions that accept a KV-like store.
 *
 * Kept separate from `hub:kv` import so the logic can be unit-tested with
 * an in-memory mock store. The login handler wires `hub:kv` in at call time.
 *
 * Strategy: token-bucket-style counter keyed by IP. After MAX_FAILURES failed
 * attempts within WINDOW_SECONDS, the IP is blocked until the TTL expires.
 */

export interface RateLimitStore {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: { ttl?: number }): Promise<void>
  del(key: string): Promise<void>
}

export interface RateLimitConfig {
  /** KV key namespace, e.g., 'login:fail' → keys become 'login:fail:1.2.3.4' */
  prefix: string
  /** Block after this many failures. */
  maxFailures: number
  /** Sliding window in seconds. */
  windowSeconds: number
}

export interface RateLimitResult {
  blocked: boolean
  current: number
  remaining: number
}

/**
 * Builds a set of rate-limit helpers bound to a specific store + config.
 *
 * @example
 * ```ts
 * import { kv } from 'hub:kv'
 * const limiter = createRateLimiter(kv, {
 *   prefix: 'login:fail',
 *   maxFailures: 5,
 *   windowSeconds: 15 * 60,
 * })
 *
 * const { blocked } = await limiter.check('1.2.3.4')
 * if (blocked) throw new Error('Too many attempts')
 * await limiter.increment('1.2.3.4')
 * ```
 */
export function createRateLimiter(store: RateLimitStore, config: RateLimitConfig) {
  const keyFor = (id: string) => `${config.prefix}:${id}`

  return {
    keyFor,

    /** Returns the current failure count for an identifier. */
    async getCount(id: string): Promise<number> {
      const raw = await store.get<number>(keyFor(id))
      return typeof raw === 'number' ? raw : 0
    },

    /**
     * Checks whether an identifier is currently blocked.
     * Returns the count, block status, and remaining attempts.
     */
    async check(id: string): Promise<RateLimitResult> {
      const current = await this.getCount(id)
      return {
        blocked: current >= config.maxFailures,
        current,
        remaining: Math.max(0, config.maxFailures - current)
      }
    },

    /**
     * Increments the failure counter and refreshes the TTL.
     * Returns the new count.
     */
    async increment(id: string): Promise<number> {
      const current = await this.getCount(id)
      const next = current + 1
      await store.set(keyFor(id), next, { ttl: config.windowSeconds })
      return next
    },

    /** Resets the counter (call on successful authentication). */
    async reset(id: string): Promise<void> {
      await store.del(keyFor(id))
    }
  }
}

/** Type of the object returned by `createRateLimiter`. */
export type RateLimiter = ReturnType<typeof createRateLimiter>
