/**
 * Drizzle Kit config for local introspection only.
 *
 * Schema migrations are owned by Alchemy v2:
 * - `Drizzle.Schema` in `infra/database.ts` generates SQL on deploy
 * - `Cloudflare.D1.Database` applies `migrationsDir` to D1
 *
 * @see https://v2.alchemy.run/drizzle/migrations/
 */
import { join } from 'node:path'
import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.TURSO_DATABASE_URL
  || process.env.LIBSQL_URL
  || process.env.DATABASE_URL
  || `file:${join(process.cwd(), '.data/db/sqlite.db')}`

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations/sqlite',
  dialect: 'sqlite',
  dbCredentials: {
    url: databaseUrl,
  },
})
