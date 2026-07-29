import { z } from 'zod'
import { useQueries } from '../../../utils/db'
import { requireEditor } from '../../../utils/http-auth'
import { validateBody } from '../../../utils/validate'
import { createApiError, fromQueryError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'

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
    const run = await useQueries(event).contentGeneration.approveRun(
      runId,
      session.user.id,
      body.reviewNote,
    )
    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
