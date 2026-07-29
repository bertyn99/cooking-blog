import { sql } from 'drizzle-orm'
import type { AppDb } from './create-db'

let configured = false

/** Improve concurrent reads/writes on local file SQLite (dev import + API). */
export async function ensureLocalSqlitePragmas(db: AppDb) {
  if (configured) {
    return
  }
  configured = true
  try {
    await db.run(sql`PRAGMA journal_mode = WAL`)
    await db.run(sql`PRAGMA busy_timeout = 10000`)
  }
  catch {
    configured = false
  }
}
