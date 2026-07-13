import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { validateBody } from '../../utils/validate'
import { updateRecipeSchema } from '../../utils/validations/recipes'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const db = useDb(event)

  const existing = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id)).get()
  if (!existing) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const data = validateBody(updateRecipeSchema, body)

  const updates: Record<string, unknown> = { ...data }

  if (data.status === 'published') {
    updates.publishedAt = new Date().toISOString()
    if (!existing.firstPublishedAt) updates.firstPublishedAt = new Date().toISOString()
  }

  const result = await db.update(schema.recipes)
    .set(updates)
    .where(eq(schema.recipes.id, id))
    .returning()
    .get()

  // Handle nested ingredients (full replace)
  if (data.ingredients !== undefined) {
    await db.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, id))
    if (data.ingredients?.length) {
      await db.insert(schema.ingredients).values(
        data.ingredients.map((ing, i) => ({
          recipeId: id,
          name: ing.name,
          qty: ing.qty,
          unit: ing.unit || 'none',
          sortOrder: ing.sortOrder ?? i,
        }))
      )
    }
  }

  // Handle nutrition (upsert)
  if (data.nutrition !== undefined) {
    await db.delete(schema.nutrition).where(eq(schema.nutrition.recipeId, id))
    if (Object.keys(data.nutrition).length > 0) {
      await db.insert(schema.nutrition).values({ recipeId: id, ...data.nutrition })
    }
  }

  return result
})
