import type { H3Event } from 'h3'
import { getCloudflareEnv } from './cloudflare-env'

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

const memory = new Map<string, { value: unknown, expiresAt?: number }>()

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

export function useKvStore(event?: H3Event): KvStore {
  const kv = useKv(event)
  return kv ? createKvStore(kv) : memoryKvStore
}
