import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { relations } from './relations'

declare module 'hub:db' {
  export * from 'hub:db:schema'
  export const db: LibSQLDatabase<typeof relations>
}
