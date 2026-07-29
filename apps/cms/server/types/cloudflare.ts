/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker bindings provisioned by Alchemy (infra/workers.ts).
 * @see https://v2.alchemy.run/cloudflare/data/d1
 */
export interface GenerationWorkflowParams {
  runId: string
}

export interface CloudflareBindings {
  DB: D1Database
  Media: R2Bucket
  Cache: KVNamespace
  AI?: Ai
  /** Durable generation pipeline (Workflows). */
  CONTENT_GENERATION?: Workflow<GenerationWorkflowParams>
}

export interface WorkersCachePurge {
  purge(options: { tags?: string[], prefixes?: string[] }): Promise<unknown>
}

declare module 'h3' {
  interface H3EventContext {
    cloudflare?: {
      env: CloudflareBindings
      context?: {
        waitUntil?: (promise: Promise<unknown>) => void
        cache?: WorkersCachePurge
      }
    }
  }
}
