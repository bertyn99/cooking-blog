import type { H3Event } from 'h3'
import {
  createContentGenerationQueries,
  type GenerationStepKey,
} from '../../db/queries/content-generation'
import type { AppDb } from '../../db/create-db'
import { queryConflict, queryNotFound } from '../../db/query-errors'
import { useDb } from '../../utils/db'
import { getCloudflareEnv } from '../../utils/cloudflare-env'
import { useGenerationArtifactStore } from './artifact-storage'
import { useGenerationProgressStore } from './progress'
import { executeGenerationStep } from './step-runner'
import { logBackgroundError, logRequestError } from '../../utils/logging'
import { runInBackground, shouldDeferWorkToBackground } from '../../utils/background-task'
import {
  GENERATION_REVIEW_EVENT_TYPE,
  reviewNotesArtifactKey,
  type GenerationReviewAction,
  type GenerationReviewEventPayload,
} from './review-event'

export function createContentGenerationService(db: AppDb, event?: H3Event) {
  const queries = createContentGenerationQueries(db)
  const artifacts = useGenerationArtifactStore(event)
  const progress = useGenerationProgressStore(event)
  const stepDeps = {
    ai: getCloudflareEnv(event)?.AI,
    gatewayId: getCloudflareEnv(event)?.CMS_AI_GATEWAY_ID,
  }

  async function sendReviewEvent(runId: string, payload: GenerationReviewEventPayload) {
    const workflow = getCloudflareEnv(event)?.CONTENT_GENERATION
    if (!workflow) {
      return
    }
    try {
      const instance = await workflow.get(runId)
      await instance.sendEvent({
        type: GENERATION_REVIEW_EVENT_TYPE,
        payload,
      })
    } catch (error) {
      const context = {
        generation: {
          operation: 'send-review-event',
          runId,
        },
      }
      if (event) {
        logRequestError(event, error, context)
      } else {
        logBackgroundError('generation-review-event', error, context)
      }
    }
  }

  return {
    findById(runId: string) {
      return queries.findById(runId)
    },

    listAwaitingReview(
      input: {
        excludeRequestedByUserId?: number | null
        limit?: number
      } = {}
    ) {
      return queries.listAwaitingReview(input)
    },

    countAwaitingReview(excludeRequestedByUserId?: number | null) {
      return queries.countAwaitingReview(excludeRequestedByUserId)
    },

    listChildren(parentRunId: string) {
      return queries.listChildren(parentRunId)
    },

    async getDiscoverArtifact(runId: string) {
      const run = await queries.findById(runId)
      if (!run) {
        return null
      }
      return artifacts.getJson(run.artifactPrefix, 'discover')
    },

    async selectCandidates(runId: string, candidateIds: string[], selectedByUserId: number) {
      const parent = await queries.findById(runId)
      if (!parent) {
        throw queryNotFound('Generation run not found')
      }
      if (parent.runKind !== 'batch') {
        throw queryConflict('Only batch runs support candidate selection')
      }
      if (parent.status !== 'awaiting_selection') {
        throw queryConflict('Batch run is not awaiting candidate selection')
      }

      const discover = await artifacts.getJson<{
        candidates?: Array<{
          id: string
          title: string
          targetType: 'article' | 'recipe'
          markdown: string
        }>
      }>(parent.artifactPrefix, 'discover')

      const all = discover?.candidates ?? []
      const selected = all.filter((candidate) => candidateIds.includes(candidate.id))
      if (selected.length === 0) {
        throw queryConflict('No matching candidates for the given ids')
      }

      const parentSource = await artifacts.getJson<{
        sourceKind?: string
        locale?: string
        sourceUrl?: string
        ebookObjectKey?: string
        title?: string
      }>(parent.artifactPrefix, 'source-pack')

      const children: Array<NonNullable<Awaited<ReturnType<typeof queries.findById>>>> = []

      for (const candidate of selected) {
        const childId = crypto.randomUUID()
        const artifactPrefix = `runs/${childId}`
        await artifacts.putJson(artifactPrefix, 'source-pack', {
          sourceKind: 'ebook',
          title: candidate.title,
          locale: parentSource?.locale ?? 'fr',
          markdown: candidate.markdown,
          sourceUrl: parentSource?.sourceUrl,
          ebookObjectKey: parentSource?.ebookObjectKey,
          parentRunId: parent.id,
          candidateId: candidate.id,
        })

        const child = await queries.createRun({
          id: childId,
          targetType: candidate.targetType,
          artifactPrefix,
          requestedByUserId: selectedByUserId,
          parentRunId: parent.id,
          runKind: 'unit',
        })
        if (child) {
          children.push(child)
          await this.startProcessing(childId)
        }
      }

      await artifacts.putJson(parent.artifactPrefix, 'selection', {
        selectedCandidateIds: selected.map((c) => c.id),
        childRunIds: children.map((c) => c.id),
        selectedByUserId,
        selectedAt: new Date().toISOString(),
      })

      const updatedParent = await queries.markBatchSelectionComplete(runId, children.length)
      return {
        parent: updatedParent,
        children,
      }
    },

    createRun(input: Parameters<typeof queries.createRun>[0]) {
      return queries.createRun(input).then(async (run) => {
        if (run) {
          await progress.set({
            runId: run.id,
            stepKey: 'queued',
            status: 'pending',
            updatedAt: new Date().toISOString(),
            message: 'Run en file d’attente',
          })
        }
        return run
      })
    },

    /**
     * Start Cloudflare Workflow when bound; otherwise kick processRunOnce (local/dev).
     */
    async startProcessing(runId: string) {
      const env = getCloudflareEnv(event)
      const workflow = env?.CONTENT_GENERATION

      if (workflow) {
        try {
          await workflow.create({
            id: runId,
            params: { runId },
          })
        } catch (error) {
          // Revising may resume an existing instance via sendEvent only.
          const message = error instanceof Error ? error.message : String(error)
          if (!message.toLowerCase().includes('already')) {
            throw error
          }
        }
        await progress.set({
          runId,
          stepKey: 'queued',
          status: 'running',
          updatedAt: new Date().toISOString(),
          message: 'Workflow démarré',
        })
        return { mode: 'workflow' as const, runId }
      }

      const kick = async () => {
        await this.processRunOnce(runId)
      }

      if (event && shouldDeferWorkToBackground(event)) {
        await runInBackground(event, kick, {
          task: 'generation-fallback',
          runId,
        })
      } else {
        void kick().catch((error: unknown) => {
          logBackgroundError('generation-fallback', error, { runId })
        })
      }

      return { mode: 'fallback' as const, runId }
    },

    async approveRun(runId: string, reviewerUserId: number, reviewNote?: string | null) {
      return this.reviewRun(runId, {
        action: 'approve',
        reviewerUserId,
        reviewNote,
      })
    },

    async reviewRun(
      runId: string,
      input: {
        action: GenerationReviewAction
        reviewerUserId: number
        reviewNote?: string | null
        reason?: string | null
        focusSteps?: string[] | null
      }
    ) {
      const existing = await queries.findById(runId)
      if (!existing) {
        throw queryNotFound('Generation run not found')
      }
      const round = existing.reviewRound && existing.reviewRound > 0 ? existing.reviewRound : 1

      switch (input.action) {
        case 'approve': {
          const run = await queries.approveRun(runId, input.reviewerUserId, input.reviewNote)
          await sendReviewEvent(runId, {
            action: 'approve',
            reviewerUserId: input.reviewerUserId,
            round,
            reviewNote: input.reviewNote ?? null,
          })
          return run
        }
        case 'reject': {
          const reason = (input.reason ?? input.reviewNote ?? '').trim()
          if (!reason) {
            throw queryConflict('Reject reason is required')
          }
          const run = await queries.rejectRun(runId, input.reviewerUserId, reason)
          await sendReviewEvent(runId, {
            action: 'reject',
            reviewerUserId: input.reviewerUserId,
            round,
            reason,
            reviewNote: reason,
          })
          return run
        }
        case 'request_changes': {
          const note = (input.reviewNote ?? '').trim()
          if (!note) {
            throw queryConflict('Review note is required for request_changes')
          }
          const result = await queries.requestChanges(runId, input.reviewerUserId, {
            reviewNote: note,
            focusSteps: input.focusSteps,
          })
          await artifacts.putJson(existing.artifactPrefix, reviewNotesArtifactKey(result.round), {
            round: result.round,
            reviewNote: note,
            focusSteps: input.focusSteps ?? null,
            reviewerUserId: input.reviewerUserId,
            at: new Date().toISOString(),
          })
          await sendReviewEvent(runId, {
            action: 'request_changes',
            reviewerUserId: input.reviewerUserId,
            round: result.round,
            reviewNote: note,
            focusSteps: input.focusSteps ?? null,
          })

          // Local/dev without Workflows: kick revise processing.
          if (!getCloudflareEnv(event)?.CONTENT_GENERATION) {
            await this.startProcessing(runId)
          }

          return result.run
        }
        default: {
          const _exhaustive: never = input.action
          throw queryConflict(`Unknown review action: ${String(_exhaustive)}`)
        }
      }
    },

    getProgress(runId: string) {
      return progress.get(runId)
    },

    async processDueRuns(limit = 5) {
      const claimed = await queries.claimRunnableRuns(limit)
      const results = []
      for (const runId of claimed) {
        try {
          results.push(await this.processRunOnce(runId))
        } catch (error) {
          results.push({ runId, error: String(error) })
        }
      }
      return { claimed: claimed.length, results }
    },

    async processRunOnce(runId: string) {
      const processedSteps: GenerationStepKey[] = []

      while (true) {
        const run = await queries.findById(runId)
        if (!run) {
          throw queryNotFound('Generation run not found')
        }

        const nextStep = run.steps?.find(
          (step) => step.status === 'pending' || step.status === 'running'
        )
        if (!nextStep) {
          const now = new Date().toISOString()

          if (run.runKind === 'batch') {
            await queries.completeRunAwaitingSelection(runId)
            await progress.set({
              runId,
              stepKey: 'awaiting_review',
              status: 'succeeded',
              updatedAt: now,
              message: 'Sélection des candidats',
            })
            return {
              runId,
              advanced: processedSteps.length > 0,
              completed: true,
              awaitingSelection: true as const,
              steps: processedSteps,
            }
          }

          const nextRound =
            run.status === 'revising'
              ? run.reviewRound && run.reviewRound > 0
                ? run.reviewRound + 1
                : 2
              : run.reviewRound && run.reviewRound > 0
                ? run.reviewRound
                : 1

          await queries.completeRunAwaitingReview(runId, {
            targetType: run.targetType,
            articleId: run.articleId,
            recipeId: run.recipeId,
            reviewRound: nextRound,
          })

          await progress.set({
            runId,
            stepKey: 'awaiting_review',
            status: 'succeeded',
            updatedAt: now,
            message: `Gate ${nextRound}`,
          })

          return {
            runId,
            advanced: processedSteps.length > 0,
            completed: true,
            steps: processedSteps,
          }
        }

        const now = new Date().toISOString()
        await progress.set({
          runId,
          stepKey: nextStep.stepKey,
          status: 'running',
          updatedAt: now,
        })

        const attemptCount = (nextStep.attemptCount ?? 0) + 1
        await queries.markStepRunning(nextStep.id, attemptCount, nextStep.startedAt)

        try {
          const linkedIds =
            nextStep.stepKey === 'assemble' ||
            nextStep.stepKey === 'revise_1' ||
            nextStep.stepKey === 'revise_2'
              ? await queries.findRunLinkedIds(run.id)
              : undefined

          let stepResult = await executeGenerationStep(
            artifacts,
            {
              id: run.id,
              targetType: run.targetType,
              articleId: run.articleId,
              recipeId: run.recipeId,
              artifactPrefix: run.artifactPrefix,
              requestedByUserId: run.requestedByUserId,
            },
            nextStep.stepKey,
            stepDeps,
            { linkedIds }
          )

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

          await queries.markStepSucceeded(nextStep.id, runId, stepResult.artifactKey)

          await progress.set({
            runId,
            stepKey: nextStep.stepKey,
            status: 'succeeded',
            updatedAt: now,
          })

          processedSteps.push(nextStep.stepKey)
        } catch (error) {
          const softFail =
            nextStep.stepKey === 'keyword_research' || nextStep.stepKey === 'generate_cover'

          if (softFail) {
            const artifactKey = await artifacts.putJson(run.artifactPrefix, nextStep.stepKey, {
              skipped: true,
              softFailed: true,
              error: error instanceof Error ? error.message : String(error),
              at: new Date().toISOString(),
            })
            await queries.markStepSucceeded(nextStep.id, runId, artifactKey)
            await progress.set({
              runId,
              stepKey: nextStep.stepKey,
              status: 'succeeded',
              updatedAt: now,
              message: 'Soft-failed (non-blocking)',
            })
            processedSteps.push(nextStep.stepKey)
            continue
          }

          const failure = await queries.markStepFailure({
            stepId: nextStep.id,
            runId,
            attemptCount,
            maxAttempts: run.maxAttempts ?? 3,
            error,
            stepStartedAt: nextStep.startedAt ?? null,
          })

          await progress.set({
            runId,
            stepKey: nextStep.stepKey,
            status: 'failed',
            updatedAt: now,
          })

          if (failure.terminal) {
            return {
              runId,
              advanced: processedSteps.length > 0,
              completed: false,
              failed: true as const,
              stepKey: nextStep.stepKey,
              error: failure.error,
              steps: processedSteps,
            }
          }

          return {
            runId,
            advanced: processedSteps.length > 0,
            completed: false,
            failed: true as const,
            retrying: true as const,
            stepKey: nextStep.stepKey,
            error: failure.error,
            nextAttemptAt: failure.nextAttemptAt,
            steps: processedSteps,
          }
        }
      }
    },
  }
}

export function useContentGenerationService(event?: H3Event) {
  return createContentGenerationService(useDb(event), event)
}
