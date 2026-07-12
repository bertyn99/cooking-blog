import { db } from 'hub:db'
import { buildRecipeDetailQueryWhere } from '../../utils/queries/recipes'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const isAuthenticated = !!event.context?.user

  const recipe = await db.query.recipes.findFirst({
    where: buildRecipeDetailQueryWhere(id, isAuthenticated),
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
