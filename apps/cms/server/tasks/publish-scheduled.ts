import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineTask({
  meta: {
    name: 'publish-scheduled',
    description: 'Publish all content types whose scheduled_at has passed',
  },
  async run() {
    const now = new Date().toISOString()
    let count = 0

    for (const table of [schema.articles, schema.recipes]) {
      const items = await db.select({ id: table.id, firstPublishedAt: table.firstPublishedAt })
        .from(table)
        .where(eq(table.status, 'scheduled'))
        .all()

      for (const item of items) {
        if (item.firstPublishedAt) continue
        await db.update(table)
          .set({
            status: 'published',
            publishedAt: now,
            firstPublishedAt: now,
            scheduledAt: null,
          })
          .where(eq(table.id, item.id))
        count++
      }
    }

    const pages = await db.select({ id: schema.pages.id })
      .from(schema.pages)
      .where(eq(schema.pages.status, 'scheduled'))
      .all()

    for (const page of pages) {
      await db.update(schema.pages)
        .set({
          status: 'published',
          publishedAt: now,
          scheduledAt: null,
        })
        .where(eq(schema.pages.id, page.id))
      count++
    }

    return { result: { published: count } }
  },
})
