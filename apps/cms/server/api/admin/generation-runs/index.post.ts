import { z } from 'zod'
import { useContentGenerationService } from '../../../services/generation/service'
import { requireEditor } from '../../../utils/http-auth'
import { validateBody } from '../../../utils/validate'
import { fromQueryError } from '../../../utils/errors'
import { serializeGenerationRunForApi } from '../../../utils/serialize-generation-run'
import { useGenerationArtifactStore } from '../../../services/generation/artifact-storage'

const sourcePackSchema = z.object({
  sourceKind: z.enum(['paste', 'article', 'ebook']).default('paste'),
  title: z.string().optional(),
  locale: z.string().default('fr'),
  markdown: z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
  ebookObjectKey: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.markdown?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['markdown'],
      message: 'markdown is required for paste, article, and ebook sources (for now)',
    })
  }
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
    const service = useContentGenerationService(event)
    const isEbookBatch = body.sourcePack?.sourceKind === 'ebook'
    const run = await service.createRun({
      id: runId,
      targetType: body.targetType,
      articleId: isEbookBatch ? null : (body.articleId ?? null),
      recipeId: isEbookBatch ? null : (body.recipeId ?? null),
      artifactPrefix,
      requestedByUserId: session.user.id,
      runKind: isEbookBatch ? 'batch' : 'unit',
    })

    const processing = await service.startProcessing(runId)

    setResponseStatus(event, 201)
    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
      meta: { processing, runKind: isEbookBatch ? 'batch' : 'unit' },
    }
  }
  catch (error) {
    fromQueryError(error)
  }
})
