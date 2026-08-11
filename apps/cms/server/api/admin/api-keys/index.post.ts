import { requireAdmin } from '../../../utils/http-auth'
import { useApiKeyService } from '../../../services/api-key-service'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const body = await readBody(event)
  const created = await useApiKeyService(event).create(body, session.user?.id ?? null)
  return {
    data: created.key,
    secret: created.secret,
  }
})
