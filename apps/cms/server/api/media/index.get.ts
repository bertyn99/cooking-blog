import { listMedia } from '../../utils/media'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return listMedia({
    limit: parseInt(query.limit as string) || 20,
    cursor: query.cursor as string | undefined,
    prefix: query.prefix as string | undefined,
  })
})
