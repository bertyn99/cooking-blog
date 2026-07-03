import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { validateBody } from '../../utils/validate'
import { updateArticleSchema } from '../../utils/validations/articles'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const existing = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).get()
  if (!existing) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const data = validateBody(updateArticleSchema, body)

  const updates: Record<string, unknown> = { ...data }

  if (data.status === 'published') {
    updates.publishedAt = new Date().toISOString()
    if (!existing.firstPublishedAt) updates.firstPublishedAt = new Date().toISOString()
  }

  const result = await db.update(schema.articles)
    .set(updates)
    .where(eq(schema.articles.id, id))
    .returning()
    .get()

  return result
})
