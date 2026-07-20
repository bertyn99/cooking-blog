import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const db = useDb(event)
  await db.update(schema.articles)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.articles.id, id))

  return sendNoContent(event)
})
