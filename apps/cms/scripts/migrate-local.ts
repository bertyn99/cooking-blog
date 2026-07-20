/**
 * Apply pending SQL migrations to the local libSQL database (`.data/db/sqlite.db`).
 *
 * Used automatically before `pnpm dev:cms`. Alchemy deploy applies the same files
 * to Cloudflare D1; this keeps local dev in sync without a network call.
 */
import { migrateLocalDb } from '../server/db/migrate-local'

migrateLocalDb().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[db:migrate:local] failed — ${message}`)
  process.exitCode = 1
})
