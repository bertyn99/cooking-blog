import { z } from 'zod'
import { canAccessAdminApi } from '../../../../shared/abilities'
import { useDashboardService } from '../../../services/dashboard-service'
import { createApiError } from '../../../utils/errors'

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

  return useDashboardService(event).buildSummary(event, parsed.data.locale)
})
