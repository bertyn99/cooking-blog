import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { slugifyString } from '../../utils/slug'
import { createApiError } from '../../utils/errors'

const createTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  locale: z.string().default('fr'),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const body = validateBody(createTagSchema, await readBody(event))
  const { tags } = useQueries(event)
  const baseSlug = body.slug || slugifyString(body.name)
  const slug = await tags.reserveUniqueSlug(baseSlug, body.locale)
  const now = new Date().toISOString()

  const tag = await tags.insert({
    name: body.name,
    slug,
    locale: body.locale,
    createdAt: now,
    updatedAt: now,
  })

  if (!tag) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create tag')
  }

  setResponseStatus(event, 201)
  return { data: tag }
})
