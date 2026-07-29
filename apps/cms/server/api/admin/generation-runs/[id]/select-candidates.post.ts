import { z } from 'zod'
import { useContentGenerationService } from '../../../../services/generation/service'
import { requireEditor } from '../../../../utils/http-auth'
import { validateBody } from '../../../../utils/validate'
import { createApiError, fromQueryError } from '../../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../../utils/serialize-generation-run'

const schema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1).max(40),
})

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const runId = getRouterParam(event, 'id')
  if (!runId) {
    throw createApiError('VALIDATION_ERROR', 'Run id is required')
  }

  const body = validateBody(schema, await readBody(event))
  try {
    const result = await useContentGenerationService(event).selectCandidates(
      runId,
      body.candidateIds,
      session.user.id,
    )
    return {
      data: {
        parent: result.parent
          ? serializeGenerationRunForApi(result.parent as Record<string, unknown>)
          : result.parent,
        children: result.children.map(child =>
          serializeGenerationRunForApi(child as Record<string, unknown>),
        ),
      },
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
