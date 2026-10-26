import { canAccessAdminApi } from '../../../../shared/abilities'
import { usePinterestService } from '../../../services/pinterest-service'
import { createApiError } from '../../../utils/errors'
import { requireAbility } from '../../../utils/http-auth'
import { isPinterestConfigured } from '../../../utils/pinterest'
import { defineEventHandler } from 'nuxt/server'

/** Pinterest pipeline status — config state, counts, recent rows (admin-only). */
export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessAdminApi)

  try {
    const summary = await usePinterestService(event).summary()
    return {
      configured: isPinterestConfigured(),
      byStatus: summary.byStatus,
      recent: summary.recent,
    }
  }
  catch (error) {
    throw createApiError('INTERNAL_ERROR', 'Pinterest status failed', error instanceof Error ? error.message : undefined)
  }
})
