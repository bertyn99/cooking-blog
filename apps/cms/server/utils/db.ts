import type { H3Event } from 'h3'
import { createD1Db, type AppDb } from '../db/create-db'
import { getCloudflareEnv } from './cloudflare-env'
import { getLocalDb } from '../db/client'

/**
 * Request-scoped Drizzle client. Prefers Cloudflare D1 when bindings are available,
 * otherwise falls back to local libSQL (`.data/db/sqlite.db`).
 */
export function useDb(event?: H3Event): AppDb {
  const env = getCloudflareEnv(event)
  if (env?.DB) {
    return createD1Db(env.DB) as unknown as AppDb
  }
  return getLocalDb()
}
