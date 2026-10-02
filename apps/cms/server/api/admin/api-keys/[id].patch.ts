import { requireAdmin } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { useApiKeyService } from '../../../services/api-key-service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('VALIDATION_ERROR', 'Identifiant de clé invalide.')
  }

  const body = await readBody(event)
  const data = await useApiKeyService(event).updateScopes(id, body)
  return { data }
})
