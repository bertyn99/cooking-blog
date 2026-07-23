import { z } from 'zod'
import { useQueries } from '../../../utils/db'
import { requireEditor } from '../../../utils/http-auth'
import { validateBody } from '../../../utils/validate'
import { createApiError, fromQueryError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'

const createSchema = z.object({
  id: z.string().uuid().optional(),
  targetType: z.enum(['article', 'recipe']),
  articleId: z.number().int().positive().optional(),
  recipeId: z.number().int().positive().optional(),
  artifactPrefix: z.string().min(1),
}).superRefine((value, ctx) => {
  if (value.targetType === 'article' && !value.articleId) {
    ctx.addIssue({ code: 'custom', message: 'articleId is required for article runs' })
  }
  if (value.targetType === 'recipe' && !value.recipeId) {
    ctx.addIssue({ code: 'custom', message: 'recipeId is required for recipe runs' })
  }
})

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const body = validateBody(createSchema, await readBody(event))
  const runId = body.id ?? crypto.randomUUID()

  const run = await useQueries(event).contentGeneration.createRun({
    id: runId,
    targetType: body.targetType,
    articleId: body.articleId ?? null,
    recipeId: body.recipeId ?? null,
    artifactPrefix: body.artifactPrefix,
    requestedByUserId: session.user.id,
  })

  setResponseStatus(event, 201)
  return {
    data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
  }
})
