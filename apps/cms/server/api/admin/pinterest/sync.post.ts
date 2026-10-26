import { canAccessAdminApi } from '../../../../shared/abilities'
import { usePinterestService } from '../../../services/pinterest-service'
import { createApiError } from '../../../utils/errors'
import { requireAbility } from '../../../utils/http-auth'
import { defineEventHandler } from 'nuxt/server'

/**
 * Backfill — enqueue pin rows for every published article/recipe that has no
 * pins yet. Rows drain via the `pinterest-publish-due` task (72h spacing +
 * daily cap), so a first sync schedules the cover pins over the coming days.
 */
export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessAdminApi)

  try {
    const result = await usePinterestService(event).backfill()
    return { ok: true, ...result }
  }
  catch (error) {
    throw createApiError('INTERNAL_ERROR', 'Pinterest sync failed', error instanceof Error ? error.message : undefined)
  }
})
