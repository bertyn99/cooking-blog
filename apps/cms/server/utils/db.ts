import type { H3Event } from 'h3'
import { createD1Db, type AppDb } from '../db/create-db'
import { createDbQueries } from '../db/queries'
import { getCloudflareEnv } from './cloudflare-env'
import { getLocalDb } from '../db/client'

/**
 * Whether HTTP handlers and tasks should use the Cloudflare D1 binding.
 *
 * Local `pnpm dev` migrates `.data/db/sqlite.db` (libSQL). Nitro's Cloudflare dev
 * emulation still exposes an empty in-memory D1 — using it would hide imported data.
 * Set `CMS_USE_D1=true` to exercise the D1 path locally.
 */
export function prefersD1Database(): boolean {
  if (process.env.CMS_USE_D1 === 'true') {
    return true
  }
  return process.env.NODE_ENV === 'production'
}

/**
 * Request-scoped Drizzle client. Uses D1 on deployed workers; local dev uses libSQL
 * (see `prefersD1Database()`).
 */
export function useDb(event?: H3Event): AppDb {
  if (!prefersD1Database()) {
    return getLocalDb()
  }

  const env = getCloudflareEnv(event)
  if (env?.DB) {
    return createD1Db(env.DB) as unknown as AppDb
  }
  return getLocalDb()
}

/** Typed query layer — prefer over raw `useDb` in handlers and services. */
export function useQueries(event?: H3Event) {
  return createDbQueries(useDb(event))
}
