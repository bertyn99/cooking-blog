import { validateBody } from '../../utils/validate'
import { createRecipeSchema } from '../../utils/validations/recipes'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody(event)
  const data = validateBody(createRecipeSchema, body)
  const { recipes } = useQueries(event)

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await recipes.reserveUniqueSlug(baseSlug, data.locale || 'fr')

  const result = await recipes.insert({
    title: data.title,
    intro: data.intro,
    slug,
    categoryId: data.categoryId,
    step: data.step,
    difficulty: data.difficulty,
    time: data.time,
    coverBlobPathname: data.coverBlobPathname,
    coverAltText: data.coverAltText,
    coverDescription: data.coverDescription,
    locale: data.locale || 'fr',
    localeGroupId: data.localeGroupId,
    status: 'draft',
  })

  if (data.ingredients?.length) {
    await recipes.replaceIngredients(result.id, data.ingredients)
  }
  if (data.utensils?.length) {
    await recipes.replaceUtensils(result.id, data.utensils)
  }
  if (data.nutrition) {
    await recipes.replaceNutrition(result.id, data.nutrition)
  }

  setResponseStatus(event, 201)
  return result
})
