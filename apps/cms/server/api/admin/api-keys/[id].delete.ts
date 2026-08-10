import { requireAdmin } from '../../../../utils/http-auth'
import { createApiError } from '../../../../utils/errors'
import { useApiKeyService } from '../../../../services/api-key-service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Identifiant de clé invalide.')
  }
  const key = await useApiKeyService(event).revoke(id)
  return { data: key }
})
