import * as Cloudflare from 'alchemy/Cloudflare'
import * as Drizzle from 'alchemy/Drizzle'
import * as Effect from 'effect/Effect'

const CMS_SCHEMA = './apps/cms/server/db/schema.ts'
const CMS_MIGRATIONS = './apps/cms/server/db/migrations/sqlite'

export const cmsSchema = Drizzle.Schema('cms-schema', {
  schema: CMS_SCHEMA,
  out: CMS_MIGRATIONS,
  dialect: 'sqlite',
})

export const database = Effect.gen(function* () {
  const schema = yield* cmsSchema

  const DB = yield* Cloudflare.D1.Database('DB', {
    migrationsDir: schema.out,
    migrationsTable: 'drizzle_migrations',
    primaryLocationHint: 'weur',
  })

  return { DB, schema }
})
