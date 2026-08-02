import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers'
import { NonRetryableError } from 'cloudflare:workflows'
import {
  GENERATION_BATCH_STEP_KEYS,
  GENERATION_STEP_KEYS,
  createContentGenerationQueries,
  type GenerationStepKey,
} from '../db/queries/content-generation'
import { createD1Db } from '../db/create-db'
import type { CloudflareBindings, GenerationWorkflowParams } from '../types/cloudflare'
import { createGenerationArtifactStore } from '../services/generation/artifact-storage'
import { createGenerationProgressStore } from '../services/generation/progress'
import { createKvStore, memoryKvStore } from '../utils/kv'
import { executeGenerationStep } from '../services/generation/step-runner'
import {
  GENERATION_REVIEW_EVENT_TYPE,
  maxReviewGatesForTarget,
  type GenerationReviewEventPayload,
} from '../services/generation/review-event'

export type { GenerationWorkflowParams }

type WorkflowEnv = CloudflareBindings

const SOFT_FAIL_STEPS = new Set<GenerationStepKey>([
  'keyword_research',
  'generate_cover',
])

const STEP_TIMEOUT: Partial<Record<GenerationStepKey, string>> = {
  normalize: '2 minutes',
  classify: '2 minutes',
  keyword_research: '5 minutes',
  extract: '15 minutes',
  assemble: '5 minutes',
  validate: '2 minutes',
  generate_cover: '5 minutes',
  revise_1: '15 minutes',
  revise_2: '15 minutes',
  discover: '5 minutes',
}

function isNonRetryableStepError(stepKey: GenerationStepKey, error: unknown) {
  if (stepKey === 'validate') {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('markdown is required') || message.includes('Extract validation failed')
    || message.includes('Revised extract validation failed')
}

async function runDurableStep(
  env: WorkflowEnv,
  runId: string,
  stepKey: GenerationStepKey,
) {
  if (!env.DB) {
    throw new Error('DB binding missing in ContentGenerationWorkflow')
  }

  const db = createD1Db(env.DB) as unknown as Parameters<typeof createContentGenerationQueries>[0]
  const queries = createContentGenerationQueries(db)
  const artifacts = createGenerationArtifactStore(env.Media)
  const progress = createGenerationProgressStore(
    env.Cache ? createKvStore(env.Cache) : memoryKvStore,
  )

  const run = await queries.findById(runId)
  if (!run) {
    throw new NonRetryableError(`Generation run not found: ${runId}`)
  }

  if (stepKey === 'revise_1' || stepKey === 'revise_2') {
    await queries.ensureReviseStep(runId, stepKey)
  }

  const refreshed = await queries.findById(runId)
  const stepRow = refreshed?.steps?.find(step => step.stepKey === stepKey)
  if (!stepRow) {
    throw new NonRetryableError(`Step ${stepKey} missing on run ${runId}`)
  }

  if (stepRow.status === 'succeeded' || stepRow.status === 'skipped') {
    return {
      skipped: true as const,
      reason: 'already-complete',
      artifactKey: stepRow.artifactKey,
    }
  }

  const now = new Date().toISOString()
  const attemptCount = (stepRow.attemptCount ?? 0) + 1
  await queries.markStepRunning(stepRow.id, attemptCount, stepRow.startedAt)
  await progress.set({
    runId,
    stepKey,
    status: 'running',
    updatedAt: now,
  })

  try {
    const linkedIds = stepKey === 'assemble' || stepKey === 'revise_1' || stepKey === 'revise_2'
      ? await queries.findRunLinkedIds(run.id)
      : undefined

    let stepResult = await executeGenerationStep(artifacts, {
      id: run.id,
      targetType: run.targetType,
      articleId: run.articleId,
      recipeId: run.recipeId,
      artifactPrefix: run.artifactPrefix,
      requestedByUserId: run.requestedByUserId,
    }, stepKey, { ai: env.AI, gatewayId: env.CMS_AI_GATEWAY_ID }, { linkedIds })

    if (stepResult.pendingAssemble) {
      const linked = await queries.applyAssembledDraftAndLinkRun(run.id, {
        targetType: run.targetType,
        articleId: run.articleId,
        recipeId: run.recipeId,
        requestedByUserId: run.requestedByUserId,
        assemble: stepResult.pendingAssemble,
      })
      const artifactKey = await artifacts.putJson(run.artifactPrefix, 'assemble', {
        ...stepResult.pendingAssemble,
        linkedArticleId: linked.articleId,
        linkedRecipeId: linked.recipeId,
      })
      stepResult = {
        artifactKey: stepResult.artifactKey || artifactKey,
        linkedArticleId: linked.articleId,
        linkedRecipeId: linked.recipeId,
      }
    }

    if (stepResult.linkedArticleId) {
      await queries.linkRunContent(runId, { articleId: stepResult.linkedArticleId })
    }
    if (stepResult.linkedRecipeId) {
      await queries.linkRunContent(runId, { recipeId: stepResult.linkedRecipeId })
    }

    await queries.markStepSucceeded(stepRow.id, runId, stepResult.artifactKey)
    await progress.set({
      runId,
      stepKey,
      status: 'succeeded',
      updatedAt: new Date().toISOString(),
    })

    return {
      skipped: false as const,
      artifactKey: stepResult.artifactKey,
    }
  }
  catch (error) {
    if (SOFT_FAIL_STEPS.has(stepKey)) {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        skipped: true,
        softFailed: true,
        error: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      })
      await queries.markStepSucceeded(stepRow.id, runId, artifactKey)
      await progress.set({
        runId,
        stepKey,
        status: 'succeeded',
        updatedAt: new Date().toISOString(),
        message: 'Soft-failed (non-blocking)',
      })
      return { skipped: true as const, softFailed: true as const, artifactKey }
    }

    if (isNonRetryableStepError(stepKey, error)) {
      await queries.markStepFailure({
        stepId: stepRow.id,
        runId,
        attemptCount,
        maxAttempts: 1,
        error,
        stepStartedAt: stepRow.startedAt ?? null,
      })
      await progress.set({
        runId,
        stepKey,
        status: 'failed',
        updatedAt: new Date().toISOString(),
      })
      throw new NonRetryableError(
        error instanceof Error ? error.message : String(error),
      )
    }

    await progress.set({
      runId,
      stepKey,
      status: 'failed',
      updatedAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

async function markAwaitingReview(env: WorkflowEnv, runId: string, reviewRound: number) {
  if (!env.DB) {
    throw new NonRetryableError('DB binding missing')
  }
  const db = createD1Db(env.DB) as unknown as Parameters<typeof createContentGenerationQueries>[0]
  const queries = createContentGenerationQueries(db)
  const progress = createGenerationProgressStore(
    env.Cache ? createKvStore(env.Cache) : memoryKvStore,
  )
  const run = await queries.findById(runId)
  if (!run) {
    throw new NonRetryableError(`Generation run not found: ${runId}`)
  }
  await queries.completeRunAwaitingReview(runId, {
    targetType: run.targetType,
    articleId: run.articleId,
    recipeId: run.recipeId,
    reviewRound,
  })
  await progress.set({
    runId,
    stepKey: 'awaiting_review',
    status: 'succeeded',
    updatedAt: new Date().toISOString(),
    message: `Gate ${reviewRound}`,
  })
  return { status: 'awaiting_review' as const, reviewRound }
}

/**
 * Durable content generation pipeline (Cloudflare Workflows).
 * Articles: generate → review → revise ×2 → final gate.
 * Recipes: single review gate.
 *
 * @see https://developers.cloudflare.com/workflows/
 */
export class ContentGenerationWorkflow extends WorkflowEntrypoint<
  WorkflowEnv,
  GenerationWorkflowParams
> {
  async run(
    event: Readonly<WorkflowEvent<GenerationWorkflowParams>>,
    step: WorkflowStep,
  ) {
    const runId = event.payload.runId
    const env = this.env

    const runMeta = await step.do('read-run-meta', async () => {
      if (!env.DB) {
        throw new NonRetryableError('DB binding missing')
      }
      const db = createD1Db(env.DB) as unknown as Parameters<typeof createContentGenerationQueries>[0]
      const queries = createContentGenerationQueries(db)
      const run = await queries.findById(runId)
      if (!run) {
        throw new NonRetryableError(`Generation run not found: ${runId}`)
      }
      return {
        targetType: run.targetType as 'article' | 'recipe',
        runKind: (run.runKind ?? 'unit') as 'unit' | 'batch',
      }
    })

    const pipelineKeys = runMeta.runKind === 'batch'
      ? GENERATION_BATCH_STEP_KEYS
      : GENERATION_STEP_KEYS

    for (const stepKey of pipelineKeys) {
      await step.do(
        stepKey,
        {
          retries: {
            limit: SOFT_FAIL_STEPS.has(stepKey) ? 1 : 3,
            delay: '30 seconds',
            backoff: 'exponential',
          },
          timeout: STEP_TIMEOUT[stepKey] ?? '5 minutes',
        },
        async () => runDurableStep(env, runId, stepKey),
      )
    }

    if (runMeta.runKind === 'batch') {
      await step.do('mark-awaiting-selection', async () => {
        if (!env.DB) {
          throw new NonRetryableError('DB binding missing')
        }
        const db = createD1Db(env.DB) as unknown as Parameters<typeof createContentGenerationQueries>[0]
        const queries = createContentGenerationQueries(db)
        const progress = createGenerationProgressStore(
          env.Cache ? createKvStore(env.Cache) : memoryKvStore,
        )
        await queries.completeRunAwaitingSelection(runId)
        await progress.set({
          runId,
          stepKey: 'awaiting_review',
          status: 'succeeded',
          updatedAt: new Date().toISOString(),
          message: 'Sélection des candidats',
        })
        return { status: 'awaiting_selection' as const }
      })
      return {
        runId,
        status: 'awaiting_selection' as const,
      }
    }

    const maxGates = maxReviewGatesForTarget(runMeta.targetType)
    let gate = 1

    while (gate <= maxGates) {
      await step.do(`mark-awaiting-review-${gate}`, async () =>
        markAwaitingReview(env, runId, gate),
      )

      const review = await step.waitForEvent<GenerationReviewEventPayload>(
        `human-review-${gate}`,
        {
          type: GENERATION_REVIEW_EVENT_TYPE,
          timeout: '30 days',
        },
      )

      const action = review.payload.action
      switch (action) {
        case 'approve':
          return {
            runId,
            status: 'approved' as const,
            reviewerUserId: review.payload.reviewerUserId,
            reviewNote: review.payload.reviewNote ?? null,
            round: gate,
          }
        case 'reject':
          return {
            runId,
            status: 'rejected' as const,
            reviewerUserId: review.payload.reviewerUserId,
            reason: review.payload.reason ?? review.payload.reviewNote ?? null,
            round: gate,
          }
        case 'request_changes': {
          if (gate >= maxGates || runMeta.targetType !== 'article') {
            throw new NonRetryableError('No remaining revision rounds for this run')
          }
          const reviseKey = gate === 1 ? 'revise_1' as const : 'revise_2' as const
          await step.do(
            reviseKey,
            {
              retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' },
              timeout: STEP_TIMEOUT[reviseKey] ?? '15 minutes',
            },
            async () => runDurableStep(env, runId, reviseKey),
          )
          gate += 1
          break
        }
        default: {
          const _exhaustive: never = action
          throw new NonRetryableError(`Unknown review action: ${String(_exhaustive)}`)
        }
      }
    }

    throw new NonRetryableError('Review loop exhausted without approve/reject')
  }
}
