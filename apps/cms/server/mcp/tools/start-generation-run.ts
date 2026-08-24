import { z } from 'zod'
import { requireMcpTool } from '../utils/actor'
import { useContentGenerationService } from '../../services/generation/service'
import { useGenerationArtifactStore } from '../../services/generation/artifact-storage'
import { serializeGenerationRunForApi } from '../../utils/serialize-generation-run'
import { actorUserId } from '../../utils/actor'
import { mcpAnyContentToolEnabled } from '../utils/enabled'
import { generationTargetToScope } from '../utils/payload'

const MAX_MARKDOWN = 120_000

export default defineMcpTool({
  description: 'Start AI generation from pasted markdown — always creates a new draft (no update by id)',
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
  inputSchema: {
    targetType: z.enum(['article', 'recipe']).describe('New draft type'),
    markdown: z.string().min(1).max(MAX_MARKDOWN).describe('Source notes / markdown'),
    title: z.string().optional().describe('Optional working title'),
    locale: z.string().default('fr'),
  },
  enabled: event => mcpAnyContentToolEnabled(event, ['articles', 'recipes']),
  handler: async ({ targetType, markdown, title, locale }) => {
    const { event, actor } = requireMcpTool(generationTargetToScope(targetType))

    const runId = crypto.randomUUID()
    const artifactPrefix = `runs/${runId}`

    await useGenerationArtifactStore(event).putJson(artifactPrefix, 'source-pack', {
      sourceKind: 'paste' as const,
      title,
      locale,
      markdown,
    })

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
