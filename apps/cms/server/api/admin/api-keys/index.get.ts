import { requireAdmin } from '../../../utils/http-auth'
import { useApiKeyService } from '../../../services/api-key-service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const includeRevoked = query.includeRevoked === '1' || query.includeRevoked === 'true'
  const keys = await useApiKeyService(event).list(includeRevoked)
  return { data: keys }
})
