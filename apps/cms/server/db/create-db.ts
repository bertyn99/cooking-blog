import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { relations } from './relations'

export { schema, relations }

export function createD1Db(d1: D1Database) {
  return drizzleD1(d1, { relations })
}

export function createLibsqlDb(connection: {
  url: string
  authToken?: string
}) {
  return drizzleLibsql({ connection, relations })
}

export type AppDb = ReturnType<typeof createLibsqlDb>
