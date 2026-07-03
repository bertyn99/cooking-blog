import { db, schema } from 'hub:db'
import { eq, lte, sql } from 'drizzle-orm'

export default defineTask({
  meta: {
    name: 'publish-scheduled',
    description: 'Publish all content types whose scheduled_at has passed',
  },
  async run() {
    const now = new Date().toISOString()
    const tables = [
      schema.articles,
      schema.recipes,
      schema.pages,
    ]

    let count = 0
    for (const table of tables) {
      const items = await db.select({ id: table.id, firstPublishedAt: table.firstPublishedAt })
        .from(table)
        .where(eq(table.status, 'scheduled'))
        .all()

      for (const item of items) {
        if (item.firstPublishedAt) continue // paranoia check — scheduled shouldn't have been published before
        await db.update(table)
          .set({
            status: 'published',
            publishedAt: now,
            firstPublishedAt: item.firstPublishedAt ?? now,
            scheduledAt: null,
          })
          .where(eq(table.id, item.id))
        count++
      }
    }

    return { result: { published: count } }
  },
})
