import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  switch (contentType) {
    case 'articles':
      await db.update(schema.articles).set({ status: 'draft' }).where(eq(schema.articles.id, id))
      break
    case 'recipes':
      await db.update(schema.recipes).set({ status: 'draft' }).where(eq(schema.recipes.id, id))
      break
    case 'pages':
      await db.update(schema.pages).set({ status: 'draft' }).where(eq(schema.pages.id, id))
      break
    case 'categories':
      await db.update(schema.categories).set({ status: 'draft' }).where(eq(schema.categories.id, id))
      break
    case 'category-articles':
      await db.update(schema.categoryArticles).set({ status: 'draft' }).where(eq(schema.categoryArticles.id, id))
      break
    default:
      throw createError({ statusCode: 400, statusMessage: `Unknown content type: ${contentType}` })
  }

  return { status: 'draft' }
})
