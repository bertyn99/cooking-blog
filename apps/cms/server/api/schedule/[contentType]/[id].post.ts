import { createPublishingService } from '../../../services/publishing-service'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 404 })
  }

  const body = await readBody<{ date?: string, scheduledAt?: string }>(event)
  const scheduledAt = body?.scheduledAt ?? body?.date
  if (!scheduledAt) {
    throw createError({ statusCode: 400, statusMessage: 'scheduledAt is required' })
  }

  const db = useDb(event)
  return createPublishingService(db).schedule(contentType, id, scheduledAt)
})
