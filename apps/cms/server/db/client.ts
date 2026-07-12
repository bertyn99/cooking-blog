import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from 'hub:db:schema'
import { relations } from './relations'

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

const db = drizzle({ connection: resolveLibsqlConnection(), relations })

export { db, schema }
