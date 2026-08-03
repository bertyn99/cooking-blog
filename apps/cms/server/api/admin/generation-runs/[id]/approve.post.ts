import { z } from 'zod'
import { useContentGenerationService } from '../../../../services/generation/service'
import { requireEditor } from '../../../../utils/http-auth'
import { validateBody } from '../../../../utils/validate'
import { createApiError, fromQueryError } from '../../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../../utils/serialize-generation-run'

/** @deprecated Prefer POST /review with action: 'approve'. Kept for compatibility. */
const schema = z.object({
  reviewNote: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const runId = getRouterParam(event, 'id')
  if (!runId) {
    throw createApiError('VALIDATION_ERROR', 'Run id is required')
  }

  const body = validateBody(schema, await readBody(event))
  try {
    const run = await useContentGenerationService(event).reviewRun(runId, {
      action: 'approve',
      reviewerUserId: session.user.id,
      reviewNote: body.reviewNote,
    })
    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
