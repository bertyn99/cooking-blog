import { eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { navigationItems } from '../schema/navigation-items'

export function createNavigationQueries(db: AppDb) {
  return {
    listByLocale(locale: string) {
      return db
        .select()
        .from(navigationItems)
        .where(eq(navigationItems.locale, locale))
        .orderBy(navigationItems.sortOrder)
        .all()
    },

    findById(id: number) {
      return db.select().from(navigationItems).where(eq(navigationItems.id, id)).get()
    },

    insert(values: typeof navigationItems.$inferInsert) {
      return db.insert(navigationItems).values(values).returning().get()
    },

    updateById(id: number, updates: Partial<typeof navigationItems.$inferInsert>) {
      return db.update(navigationItems).set(updates).where(eq(navigationItems.id, id)).returning().get()
    },

    deleteById(id: number) {
      return db.delete(navigationItems).where(eq(navigationItems.id, id))
    },
  }
}
