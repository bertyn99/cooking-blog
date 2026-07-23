import { useContentGenerationService } from '../../../services/generation/service'
import { requireEditor } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const runId = getRouterParam(event, 'id')
  if (!runId) {
    throw createApiError('VALIDATION_ERROR', 'Run id is required')
  }

  const progress = await useContentGenerationService(event).getProgress(runId)
  return { data: progress }
})
