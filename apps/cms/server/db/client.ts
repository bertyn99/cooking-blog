import { join } from 'node:path'
import { createLibsqlDb, type AppDb } from './create-db'
import { ensureLocalSqlitePragmas } from './local-sqlite-pragmas'

function resolveLibsqlConnection() {
  const url = process.env.TURSO_DATABASE_URL
    || process.env.LIBSQL_URL
    || process.env.DATABASE_URL

  if (url) {
    return {
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
    }
  }

  return { url: `file:${join(process.cwd(), '.data/db/sqlite.db')}` }
}

let localDb: AppDb | undefined

/** Singleton libSQL client for local development. */
export function getLocalDb(): AppDb {
  if (!localDb) {
    localDb = createLibsqlDb(resolveLibsqlConnection())
    void ensureLocalSqlitePragmas(localDb)
  }
  return localDb
}

/**
 * @deprecated Use `useDb(event)` for request-scoped D1/libSQL selection.
 */
export const db = getLocalDb()

export { schema } from './create-db'
