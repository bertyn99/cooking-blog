import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { validateBody } from '../../utils/validate'
import { updateArticleSchema } from '../../utils/validations/articles'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const db = useDb(event)
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
