import { z } from 'zod'
import { canAccessAdminApi } from '../../../../shared/abilities'
import { buildDashboardSummary } from '../../../services/dashboard-service'
import { createApiError } from '../../../utils/errors'
import { useDb } from '../../../utils/db'

const querySchema = z.object({
  locale: z.string().default('fr'),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid dashboard query', parsed.error.flatten())
  }

  const db = useDb(event)
  return buildDashboardSummary(db, event, parsed.data.locale)
})
