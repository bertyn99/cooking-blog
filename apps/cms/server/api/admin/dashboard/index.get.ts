import { z } from 'zod'
import { canEditContent } from '../../../../shared/abilities'
import { useDashboardService } from '../../../services/dashboard-service'
import { createApiError } from '../../../utils/errors'
import { requireAbility } from '../../../utils/http-auth'

const querySchema = z.object({
  locale: z.string().default('fr'),
})

export default defineEventHandler(async (event) => {
  await requireAbility(event, canEditContent)

  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid dashboard query', parsed.error.flatten())
  }

  return useDashboardService(event).buildSummary(event, parsed.data.locale)
})
