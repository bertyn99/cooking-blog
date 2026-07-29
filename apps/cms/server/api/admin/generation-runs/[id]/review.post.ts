import { z } from 'zod'
import { useContentGenerationService } from '../../../../services/generation/service'
import { requireEditor } from '../../../../utils/http-auth'
import { validateBody } from '../../../../utils/validate'
import { createApiError, fromQueryError } from '../../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../../utils/serialize-generation-run'
import { GENERATION_REVIEW_ACTIONS } from '../../../../services/generation/review-event'

const schema = z.object({
  action: z.enum(GENERATION_REVIEW_ACTIONS),
  reviewNote: z.string().optional(),
  reason: z.string().optional(),
  focusSteps: z.array(z.string()).optional(),
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
      action: body.action,
      reviewerUserId: session.user.id,
      reviewNote: body.reviewNote,
      reason: body.reason,
      focusSteps: body.focusSteps,
    })
    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
