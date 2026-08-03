import { and, eq, isNull, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { paginateResult } from '../../utils/pagination'
import { redirects } from '../schema/redirects'

export function createRedirectQueries(db: AppDb) {
  return {
    async listPage(opts: {
      pagination: { offset: number, limit: number, page: number, pageSize: number }
    }) {
      const total = (await db.select({ count: sql<number>`count(*)` }).from(redirects).all())[0]?.count ?? 0
      const rows = await db
        .select()
        .from(redirects)
        .orderBy(sql`${redirects.fromPath} ASC`)
        .limit(opts.pagination.limit)
        .offset(opts.pagination.offset)
        .all()

      return paginateResult(rows, total, opts.pagination.page, opts.pagination.pageSize)
    },

    findById(id: number) {
      return db.select().from(redirects).where(eq(redirects.id, id)).get()
    },

    findByFromPath(fromPath: string, locale?: string | null) {
      return db
        .select()
        .from(redirects)
        .where(and(
          eq(redirects.fromPath, fromPath),
          locale ? eq(redirects.locale, locale) : isNull(redirects.locale),
        ))
        .get()
    },

    insert(values: typeof schema.redirects.$inferInsert) {
      return db.insert(redirects).values(values).returning().get()
    },

    updateById(id: number, updates: Partial<typeof schema.redirects.$inferInsert>) {
      return db.update(redirects).set(updates).where(eq(redirects.id, id)).returning().get()
    },

    deleteById(id: number) {
      return db.delete(redirects).where(eq(redirects.id, id))
    },
  }
}
