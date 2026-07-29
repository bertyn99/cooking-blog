import { z } from 'zod'
import { useQueries } from '../../../utils/db'
import { requireEditor } from '../../../utils/http-auth'
import { validateBody } from '../../../utils/validate'
import { fromQueryError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'
import { useGenerationArtifactStore } from '../../../services/generation/artifact-storage'

const sourcePackSchema = z.object({
  title: z.string().optional(),
  locale: z.string().default('fr'),
  markdown: z.string().optional(),
  sourceUrl: z.string().url().optional(),
})

const createSchema = z.object({
  id: z.string().uuid().optional(),
  targetType: z.enum(['article', 'recipe']),
  articleId: z.number().int().positive().optional(),
  recipeId: z.number().int().positive().optional(),
  artifactPrefix: z.string().min(1).optional(),
  sourcePack: sourcePackSchema.optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const body = validateBody(createSchema, await readBody(event))
  const runId = body.id ?? crypto.randomUUID()
  const artifactPrefix = body.artifactPrefix ?? `runs/${runId}`

  if (body.sourcePack) {
    await useGenerationArtifactStore(event).putJson(artifactPrefix, 'source-pack', body.sourcePack)
  }

  try {
    const run = await useQueries(event).contentGeneration.createRun({
      id: runId,
      targetType: body.targetType,
      articleId: body.articleId ?? null,
      recipeId: body.recipeId ?? null,
      artifactPrefix,
      requestedByUserId: session.user.id,
    })

    setResponseStatus(event, 201)
    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
