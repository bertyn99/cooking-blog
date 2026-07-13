import { eq } from 'drizzle-orm'
import { schema } from '../../db/create-db'
import { validateBody } from '../../utils/validate'
import { createRecipeSchema } from '../../utils/validations/recipes'
import { slugifyString, generateUniqueSlug } from '../../utils/slug'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = validateBody(createRecipeSchema, body)
  const db = useDb(event)

  const baseSlug = data.slug || slugifyString(data.title)
  const existing = await db.select({ slug: schema.recipes.slug })
    .from(schema.recipes)
    .where(eq(schema.recipes.locale, data.locale || 'fr'))
    .all()
  const slug = generateUniqueSlug(baseSlug, existing.map(r => r.slug))

  const result = await db.insert(schema.recipes).values({
    title: data.title,
    intro: data.intro,
    slug,
    categoryId: data.categoryId,
    step: data.step,
    difficulty: data.difficulty,
    time: data.time,
    coverBlobPathname: data.coverBlobPathname,
    locale: data.locale || 'fr',
    localeGroupId: data.localeGroupId,
    status: 'draft',
  }).returning().get()

  // Handle nested ingredients
  if (data.ingredients?.length) {
    await db.insert(schema.ingredients).values(
      data.ingredients.map((ing, i) => ({
        recipeId: result.id,
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit || 'none',
        sortOrder: ing.sortOrder ?? i,
      }))
    )
  }

  // Handle nutrition
  if (data.nutrition) {
    await db.insert(schema.nutrition).values({
      recipeId: result.id,
      ...data.nutrition,
    })
  }

  setResponseStatus(event, 201)
  return result
})
