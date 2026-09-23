import type { H3Event } from 'h3'
import type { createSiteSettingsQueries } from '../db/queries/site-settings'
import { getCloudflareEnv } from './cloudflare-env'
import { prefersD1Database, useQueries } from './db'
import { logBackgroundWarning, logRequestWarning } from './logging'

export function useKv(event?: H3Event): KVNamespace | undefined {
  return getCloudflareEnv(event)?.Cache
}

export interface KvStore {
  get<T = unknown>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: { ttl?: number }): Promise<void>
  del(key: string): Promise<void>
}

export function createKvStore(kv: KVNamespace): KvStore {
  return {
    async get<T>(key: string) {
      return kv.get(key, 'json') as Promise<T | null>
    },
    async set(key, value, opts) {
      await kv.put(key, JSON.stringify(value), {
        expirationTtl: opts?.ttl,
      })
    },
    async del(key) {
      await kv.delete(key)
    },
  }
}

function createSiteSettingsStore(
  siteSettings: ReturnType<typeof createSiteSettingsQueries>
): KvStore {
  return {
    async get<T>(key: string) {
      const row = await siteSettings.get(key)
      return (row?.value ?? null) as T | null
    },
    async set(key, value) {
      await siteSettings.upsert(key, value)
    },
    async del(key) {
      await siteSettings.deleteKey(key)
    },
  }
}

const memory = new Map<string, { value: unknown; expiresAt?: number }>()

/** In-memory KV fallback for local `nuxt dev` without Cloudflare bindings. */
export const memoryKvStore: KvStore = {
  async get<T>(key: string) {
    const entry = memory.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memory.delete(key)
      return null
    }
    return entry.value as T
  },
  async set(key, value, opts) {
    memory.set(key, {
      value,
      expiresAt: opts?.ttl ? Date.now() + opts.ttl * 1000 : undefined,
    })
  },
  async del(key) {
    memory.delete(key)
  },
}

let warnedMemoryKvWithoutBinding = false

/**
 * Ephemeral app state (import journal, locks, coverage cache).
 * On deployed Workers, D1 is used so status survives across isolates; KV is optional for dev/preview.
 */
export function useKvStore(event?: H3Event): KvStore {
  if (prefersD1Database()) {
    return createSiteSettingsStore(useQueries(event).siteSettings)
  }

  const kv = useKv(event)
  if (kv) {
    return createKvStore(kv)
  }

  const env = getCloudflareEnv(event)
  if (env?.DB && !warnedMemoryKvWithoutBinding) {
    warnedMemoryKvWithoutBinding = true
    const message = 'Cache KV binding missing while D1 is present; using in-memory storage.'
    const context = {
      cache: {
        provider: 'memory',
        persistence: 'request-local',
        reason: 'missing-binding',
      },
    }
    if (event) {
      logRequestWarning(event, message, context)
    } else {
      logBackgroundWarning('cache-fallback', message, context)
    }
  }

  return memoryKvStore
}
