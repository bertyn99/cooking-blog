import { db, schema } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const isAuthenticated = !!event.context?.user
  const conditions = [eq(schema.recipes.id, id)]
  if (!isAuthenticated) conditions.push(eq(schema.recipes.status, 'published'), isNull(schema.recipes.deletedAt))

  const recipe = await db.query.recipes.findFirst({
    where: and(...conditions),
    with: {
      ingredients: true,
      nutrition: true,
      reviews: true,
      seo: { with: { socialMeta: true } },
    },
  })
  if (!recipe) throw createError({ statusCode: 404 })

  return recipe
})
