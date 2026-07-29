import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { canAccessAdminApi } from '../../../shared/abilities'

const schema = z.object({
  value: z.unknown(),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const key = getRouterParam(event, 'key')
  if (!key?.trim()) {
    throw createApiError('VALIDATION_ERROR', 'Setting key is required')
  }

  const body = validateBody(schema, await readBody(event))
  const row = await useQueries(event).siteSettings.upsert(key, body.value)
  return { data: row }
})
