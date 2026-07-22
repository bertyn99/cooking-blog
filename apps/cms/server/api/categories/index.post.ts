import { createRecipeCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = validateBody(createRecipeCategorySchema, await readBody(event))
  const { categories } = useQueries(event)

  const baseSlug = slugifyString(body.name)
  const slug = await categories.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const category = await categories.insert({
    name: body.name,
    desc: body.desc ?? null,
    slug,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    status: body.status,
    publishedAt: body.status === 'published'
      ? (body.publishedAt ?? now)
      : (body.publishedAt ?? null),
    createdAt: now,
    updatedAt: now,
  })

  if (!category) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create category')
  }

  return { data: category }
})
