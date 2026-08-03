import { listMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return listMedia(event, {
    limit: Number.parseInt(query.limit as string, 10) || 20,
    cursor: query.cursor as string | undefined,
    prefix: query.prefix as string | undefined,
  })
})
