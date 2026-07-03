import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const TABLES: Record<string, any> = {
  articles: schema.articles,
  recipes: schema.recipes,
  pages: schema.pages,
  categories: schema.categories,
  'category-articles': schema.categoryArticles,
}

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const table = TABLES[contentType]
  if (!table) throw createError({ statusCode: 400, statusMessage: `Unknown content type: ${contentType}` })

  const existing = await db.select().from(table).where(eq(table.id, id)).get()
  if (!existing) throw createError({ statusCode: 404 })

  const now = new Date().toISOString()
  await db.update(table)
    .set({
      status: 'published',
      publishedAt: now,
      firstPublishedAt: existing.firstPublishedAt || now,
    })
    .where(eq(table.id, id))

  return { status: 'published', publishedAt: now }
})
