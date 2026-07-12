import { db, schema } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const isAuthenticated = !!event.context?.user
  const conditions = [eq(schema.articles.id, id)]
  if (!isAuthenticated) conditions.push(eq(schema.articles.status, 'published'), isNull(schema.articles.deletedAt))

  const article = await db.select().from(schema.articles).where(and(...conditions)).get()
  if (!article) throw createError({ statusCode: 404 })

  return article
})
