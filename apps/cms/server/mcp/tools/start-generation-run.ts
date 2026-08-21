import { z } from 'zod'
import { createApiError } from '../../utils/errors'
import { requireActorFromContext } from '../../utils/write-auth'
import { useContentGenerationService } from '../../services/generation/service'
import { useGenerationArtifactStore } from '../../services/generation/artifact-storage'
import { serializeGenerationRunForApi } from '../../utils/serialize-generation-run'
import { actorUserId } from '../../utils/actor'
import { mcpWriteToolEnabled } from '../utils/enabled'

const MAX_MARKDOWN = 120_000

export default defineMcpTool({
  description: 'Start AI generation from pasted markdown — always creates a new draft (no update by id)',
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    targetType: z.enum(['article', 'recipe']),
    markdown: z.string().min(1).max(MAX_MARKDOWN),
    title: z.string().optional(),
    locale: z.string().default('fr'),
  },
  enabled: (event) => {
    return mcpWriteToolEnabled(event, 'articles') || mcpWriteToolEnabled(event, 'recipes')
  },
  handler: async ({ targetType, markdown, title, locale }) => {
    const event = useEvent()
    const scope = targetType === 'article' ? 'articles' : 'recipes'
    const actor = requireActorFromContext(event, scope)

    if (markdown.length > MAX_MARKDOWN) {
      throw createApiError('VALIDATION_ERROR', `markdown exceeds ${MAX_MARKDOWN} characters`)
    }

    const runId = crypto.randomUUID()
    const artifactPrefix = `runs/${runId}`
    const sourcePack = {
      sourceKind: 'paste' as const,
      title,
      locale,
      markdown,
    }

    await useGenerationArtifactStore(event).putJson(artifactPrefix, 'source-pack', sourcePack)

    const service = useContentGenerationService(event)
    const run = await service.createRun({
      id: runId,
      targetType,
      articleId: null,
      recipeId: null,
      artifactPrefix,
      requestedByUserId: actorUserId(actor),
      runKind: 'unit',
    })

    const processing = await service.startProcessing(runId)

    return {
      data: run ? serializeGenerationRunForApi(run as Record<string, unknown>) : run,
      meta: { processing, runKind: 'unit' },
    }
  },
})
