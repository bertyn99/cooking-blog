import { createPublishingService } from '../../../../services/publishing-service'
import { canAccessAdminApi } from '../../../../../shared/abilities'
import { useDb } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const contentType = getRouterParam(event, 'contentType') || ''
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody<{ scheduledAt?: string }>(event)
  if (!body?.scheduledAt) {
    throw createError({ statusCode: 400, statusMessage: 'scheduledAt is required' })
  }

  const db = useDb(event)
  return createPublishingService(db).schedule(contentType, id, body.scheduledAt)
})
