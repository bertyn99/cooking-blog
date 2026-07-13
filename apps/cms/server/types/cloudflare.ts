/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker bindings provisioned by Alchemy (infra/workers.ts).
 * @see https://v2.alchemy.run/cloudflare/data/d1
 */
export interface CloudflareBindings {
  DB: D1Database
  Media: R2Bucket
  Cache: KVNamespace
}

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      env: CloudflareBindings
    }
  }
}
