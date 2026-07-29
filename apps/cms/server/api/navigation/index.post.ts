import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { safeHrefSchema } from '../../utils/validations/safe-href'

const schema = z.object({
  label: z.string().min(1),
  href: safeHrefSchema,
  parentId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  locale: z.string().default('fr'),
  localeGroupId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const body = validateBody(schema, await readBody(event))
  const now = new Date().toISOString()
  const row = await useQueries(event).navigation.insert({
    label: body.label,
    href: body.href,
    parentId: body.parentId ?? null,
    sortOrder: body.sortOrder ?? 0,
    locale: body.locale,
    localeGroupId: body.localeGroupId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  if (!row) {
    throw createApiError('INTERNAL_ERROR', 'Failed to create navigation item')
  }

  setResponseStatus(event, 201)
  return { data: row }
})
