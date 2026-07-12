import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const now = new Date().toISOString()

  switch (contentType) {
    case 'articles': {
      const existing = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).get()
      if (!existing) throw createError({ statusCode: 404 })
      await db.update(schema.articles)
        .set({
          status: 'published',
          publishedAt: now,
          firstPublishedAt: existing.firstPublishedAt || now,
        })
        .where(eq(schema.articles.id, id))
      break
    }
    case 'recipes': {
      const existing = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id)).get()
      if (!existing) throw createError({ statusCode: 404 })
      await db.update(schema.recipes)
        .set({
          status: 'published',
          publishedAt: now,
          firstPublishedAt: existing.firstPublishedAt || now,
        })
        .where(eq(schema.recipes.id, id))
      break
    }
    case 'pages': {
      const existing = await db.select().from(schema.pages).where(eq(schema.pages.id, id)).get()
      if (!existing) throw createError({ statusCode: 404 })
      await db.update(schema.pages)
        .set({ status: 'published', publishedAt: now })
        .where(eq(schema.pages.id, id))
      break
    }
    case 'categories': {
      const existing = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).get()
      if (!existing) throw createError({ statusCode: 404 })
      await db.update(schema.categories)
        .set({ status: 'published', publishedAt: now })
        .where(eq(schema.categories.id, id))
      break
    }
    case 'category-articles': {
      const existing = await db.select().from(schema.categoryArticles).where(eq(schema.categoryArticles.id, id)).get()
      if (!existing) throw createError({ statusCode: 404 })
      await db.update(schema.categoryArticles)
        .set({ status: 'published', publishedAt: now })
        .where(eq(schema.categoryArticles.id, id))
      break
    }
    default:
      throw createError({ statusCode: 400, statusMessage: `Unknown content type: ${contentType}` })
  }

  return { status: 'published', publishedAt: now }
})
