/**
 * Rate-limiting primitives — pure functions that accept a KV-like store.
 *
 * Kept separate from Cloudflare KV so the logic can be unit-tested with
 * an in-memory mock store. Login wires `useKvStore(event)` at call time.
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
 * const limiter = createRateLimiter(useKvStore(event), {
 *   prefix: 'login:fail',
 *   maxFailures: 5,
 *   windowSeconds: 15 * 60,
 * })
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

export interface RequestRateLimitConfig {
  prefix: string
  maxRequests: number
  windowSeconds: number
}

export interface RequestRateLimitResult {
  allowed: boolean
  current: number
  limit: number
}

/**
 * Fixed-window request counter (e.g. public `/images/**` abuse protection).
 * Increments before serving; blocks when count exceeds `maxRequests` within the TTL window.
 */
export function createRequestRateLimiter(store: RateLimitStore, config: RequestRateLimitConfig) {
  const keyFor = (id: string) => `${config.prefix}:${id}`

  return {
    async consume(id: string): Promise<RequestRateLimitResult> {
      const raw = await store.get<number>(keyFor(id))
      const current = typeof raw === 'number' ? raw : 0
      if (current >= config.maxRequests) {
        return { allowed: false, current, limit: config.maxRequests }
      }
      const next = current + 1
      await store.set(keyFor(id), next, { ttl: config.windowSeconds })
      return { allowed: true, current: next, limit: config.maxRequests }
    },
  }
}
