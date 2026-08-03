import { eq } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { siteSettings } from '../schema/site-settings'

export function createSiteSettingsQueries(db: AppDb) {
  return {
    listAll() {
      return db.select().from(siteSettings).all()
    },

    get(key: string) {
      return db.select().from(siteSettings).where(eq(siteSettings.key, key)).get()
    },

    async upsert(key: string, value: unknown) {
      const now = new Date().toISOString()
      const existing = await this.get(key)
      if (existing) {
        return db
          .update(siteSettings)
          .set({ value, updatedAt: now })
          .where(eq(siteSettings.key, key))
          .returning()
          .get()
      }
      return db.insert(siteSettings).values({ key, value, updatedAt: now }).returning().get()
    },

    deleteKey(key: string) {
      return db.delete(siteSettings).where(eq(siteSettings.key, key))
    },
  }
}
