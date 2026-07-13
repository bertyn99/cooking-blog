import { createPublishingService } from '../../../../services/publishing-service'
import { useDb } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const contentType = getRouterParam(event, 'contentType') || ''
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDb(event)
  return createPublishingService(db).publish(contentType, id)
})
