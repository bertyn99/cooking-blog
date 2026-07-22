import { createArticleCategorySchema } from '../../utils/validations/categories'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = validateBody(createArticleCategorySchema, await readBody(event))
  const { categoryArticles } = useQueries(event)

  const baseSlug = slugifyString(body.name)
  const slug = await categoryArticles.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const category = await categoryArticles.insert({
    name: body.name,
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
    throw createApiError('INTERNAL_ERROR', 'Failed to create article category')
  }

  return { data: category }
})
