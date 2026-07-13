import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const db = useDb(event)

  await db.update(schema.recipes)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.recipes.id, id))

  return sendNoContent(event)
})
