import { useContentGenerationService } from '../../../services/generation/service'
import { requireEditor } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const runId = getRouterParam(event, 'id')
  if (!runId) {
    throw createApiError('VALIDATION_ERROR', 'Run id is required')
  }

  const service = useContentGenerationService(event)
  const run = await service.findById(runId)
  if (!run) {
    throw createApiError('NOT_FOUND', 'Generation run not found')
  }

  const children = await service.listChildren(runId)
  const discover = run.runKind === 'batch'
    ? await service.getDiscoverArtifact(runId)
    : null

  return {
    data: serializeGenerationRunForApi(run as Record<string, unknown>),
    meta: {
      children: children.map(child => serializeGenerationRunForApi(child as Record<string, unknown>)),
      discover,
    },
  }
})
