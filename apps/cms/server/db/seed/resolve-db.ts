import { createD1Db, type AppDb } from '../create-db'
import { createRemoteD1Database, readRemoteD1Config } from './remote-d1'

/**
 * Resolves a Drizzle D1 client for seed scripts.
 *
 * Priority:
 * 1. Cloudflare D1 HTTP API (`CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`)
 *    — used by Alchemy `Command.Exec` on deploy/dev.
 * 2. In-process D1 binding via `globalThis.DB` when injected by the Workers runtime.
 */
export function resolveSeedDb(): AppDb {
  const remote = readRemoteD1Config()
  if (remote) {
    return createD1Db(createRemoteD1Database(remote))
  }

  const binding = (globalThis as { DB?: D1Database }).DB
  if (binding) {
    return createD1Db(binding)
  }

  throw new Error(
    'No D1 connection for seeding. Set CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, and '
    + 'CLOUDFLARE_API_TOKEN (Alchemy deploy/dev), or run via `pnpm alchemy deploy`.'
  )
}
