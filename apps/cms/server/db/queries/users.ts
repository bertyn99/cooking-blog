import { count, eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'

export function createUserQueries(db: AppDb) {
  return {
    async countAll(): Promise<number> {
      const [row] = await db.select({ value: count() }).from(schema.users)
      return Number(row?.value ?? 0)
    },

    findByEmail(email: string) {
      return db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)
        .then(rows => rows[0])
    },

    findById(id: number) {
      return db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1)
        .then(rows => rows[0])
    },

    async insert(values: {
      email: string
      username: string | null
      passwordHash: string
      role: 'admin' | 'editor'
    }) {
      const inserted = await db
        .insert(schema.users)
        .values(values)
        .returning()
      return inserted[0]
    },

    emailExists(email: string) {
      return db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)
        .then(rows => rows.length > 0)
    },
  }
}
