import { createPageSchema } from '../../utils/validations/pages'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { slugifyString } from '../../utils/slug'
import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = validateBody(createPageSchema, await readBody(event))
  const { pages } = useQueries(event)

  const baseSlug = slugifyString(body.name)
  const slug = await pages.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const page = await pages.insert({
    name: body.name,
    title: body.title ?? null,
    slug,
    content: body.content ?? null,
    parentId: body.parentId ?? null,
    status: 'draft',
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  })

  if (!page) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create page')
  }

  return { data: page }
})
