import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { validateBody } from '../../utils/validate'
import { updateRecipeSchema } from '../../utils/validations/recipes'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  const db = useDb(event)

  const existing = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id)).get()
  if (!existing) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const data = validateBody(updateRecipeSchema, body)

  const { ingredients, nutrition, utensils, ...recipeFields } = data
  const updates: Record<string, unknown> = { ...recipeFields }

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
  if (ingredients !== undefined) {
    await db.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, id))
    if (ingredients?.length) {
      await db.insert(schema.ingredients).values(
        ingredients.map((ing, i) => ({
          recipeId: id,
          name: ing.name,
          qty: ing.qty,
          unit: ing.unit || 'none',
          sortOrder: ing.sortOrder ?? i,
        }))
      )
    }
  }

  if (utensils !== undefined) {
    await db.delete(schema.recipeUtensils).where(eq(schema.recipeUtensils.recipeId, id))
    if (utensils?.length) {
      await db.insert(schema.recipeUtensils).values(
        utensils.map((row, i) => ({
          recipeId: id,
          name: row.name.trim(),
          note: row.note?.trim() || null,
          affiliateUrl: row.affiliateUrl?.trim() || null,
          sortOrder: row.sortOrder ?? i,
        }))
      )
    }
  }

  // Handle nutrition (upsert)
  if (nutrition !== undefined) {
    await db.delete(schema.nutrition).where(eq(schema.nutrition.recipeId, id))
    if (Object.keys(nutrition).length > 0) {
      await db.insert(schema.nutrition).values({ recipeId: id, ...nutrition })
    }
  }

  return result
})
