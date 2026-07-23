import { useQueries } from '../../../utils/db'
import { requireEditor } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const runId = getRouterParam(event, 'id')
  if (!runId) {
    throw createApiError('VALIDATION_ERROR', 'Run id is required')
  }

  const run = await useQueries(event).contentGeneration.findById(runId)
  if (!run) {
    throw createApiError('NOT_FOUND', 'Generation run not found')
  }

  return { data: serializeGenerationRunForApi(run as Record<string, unknown>) }
})
