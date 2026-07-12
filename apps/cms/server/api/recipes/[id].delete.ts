import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  await db.update(schema.recipes)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.recipes.id, id))

  return sendNoContent(event)
})
