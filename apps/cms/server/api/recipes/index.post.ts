import { validateBody } from '../../utils/validate'
import { createRecipeSchema } from '../../utils/validations/recipes'
import { slugifyString } from '../../utils/slug'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { authorshipOnCreate } from '../../utils/content-authorship'
import { applyInitialContentStatusPolicy } from '../../utils/content-status-policy'

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)

  const body = await readBody(event)
  const data = validateBody(createRecipeSchema, body)
  const { recipes } = useQueries(event)

  const statusPatch = applyInitialContentStatusPolicy(session.user, {
    status: data.status,
  })
  const status = statusPatch.status ?? 'draft'

  const baseSlug = data.slug || slugifyString(data.title)
  const slug = await recipes.reserveUniqueSlug(baseSlug, data.locale || 'fr')

  const now = new Date().toISOString()
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
    status,
    publishedAt: status === 'published' ? (statusPatch.publishedAt ?? now) : null,
    scheduledAt: status === 'scheduled' ? statusPatch.scheduledAt ?? null : null,
    firstPublishedAt: status === 'published' ? (statusPatch.firstPublishedAt ?? now) : null,
    ...authorshipOnCreate(session.user.id),
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
