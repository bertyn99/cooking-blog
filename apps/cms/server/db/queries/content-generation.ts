import { and, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { queryConflict, queryNotFound } from '../../db/query-errors'
import {
  contentGenerationRunSteps,
  contentGenerationRuns,
} from '../schema/content-generation'
import type { GenerationArtifactStore } from '../../services/generation/artifact-storage'
import { createGenerationArtifactStore } from '../../services/generation/artifact-storage'
import type { GenerationProgressStore } from '../../services/generation/progress'
import { createGenerationProgressStore } from '../../services/generation/progress'
import { executeGenerationStep } from '../../services/generation/step-runner'
import { memoryKvStore } from '../../utils/kv'

export interface ContentGenerationDeps {
  artifacts: GenerationArtifactStore
  progress: GenerationProgressStore
}

function defaultDeps(): ContentGenerationDeps {
  return {
    artifacts: createGenerationArtifactStore(),
    progress: createGenerationProgressStore(memoryKvStore),
  }
}

export const GENERATION_STEP_KEYS = [
  'normalize',
  'classify',
  'extract',
  'assemble',
  'validate',
  'generate_cover',
] as const

export type GenerationStepKey = (typeof GENERATION_STEP_KEYS)[number]

export type GenerationTargetType = 'article' | 'recipe'

const LEASE_MS = 120_000

function newLeaseToken() {
  return crypto.randomUUID()
}

export function createContentGenerationQueries(db: AppDb, deps?: ContentGenerationDeps) {
  const runtime = deps ?? defaultDeps()

  return {
    findById(runId: string) {
      return db.query.contentGenerationRuns.findFirst({
        where: { id: runId },
        with: { steps: { orderBy: { ordinal: 'asc' } } },
      })
    },

    listForArticle(articleId: number) {
      return db
        .select()
        .from(contentGenerationRuns)
        .where(eq(contentGenerationRuns.articleId, articleId))
        .orderBy(sql`${contentGenerationRuns.createdAt} DESC`)
        .all()
    },

    async createRun(input: {
      id: string
      targetType: GenerationTargetType
      articleId?: number | null
      recipeId?: number | null
      artifactPrefix: string
      requestedByUserId?: number | null
    }) {
      const now = new Date().toISOString()
      await db.insert(contentGenerationRuns).values({
        id: input.id,
        targetType: input.targetType,
        articleId: input.articleId ?? null,
        recipeId: input.recipeId ?? null,
        artifactPrefix: input.artifactPrefix,
        requestedByUserId: input.requestedByUserId ?? null,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      })

      await db.insert(contentGenerationRunSteps).values(
        GENERATION_STEP_KEYS.map((stepKey, index) => ({
          runId: input.id,
          stepKey,
          ordinal: index,
          idempotencyKey: `${input.id}:${stepKey}`,
          status: 'pending' as const,
        })),
      )

      return this.findById(input.id)
    },

    async claimRunnableRuns(limit = 5) {
      const now = new Date().toISOString()
      const candidates = await db
        .select({ id: contentGenerationRuns.id })
        .from(contentGenerationRuns)
        .where(and(
          inArray(contentGenerationRuns.status, ['queued', 'running']),
          or(
            isNull(contentGenerationRuns.leaseExpiresAt),
            lte(contentGenerationRuns.leaseExpiresAt, now),
          ),
          or(
            isNull(contentGenerationRuns.nextAttemptAt),
            lte(contentGenerationRuns.nextAttemptAt, now),
          ),
        ))
        .limit(limit)
        .all()

      const claimed: string[] = []
      for (const row of candidates) {
        const token = newLeaseToken()
        const expiresAt = new Date(Date.now() + LEASE_MS).toISOString()
        const current = await db
          .select({
            status: contentGenerationRuns.status,
            startedAt: contentGenerationRuns.startedAt,
          })
          .from(contentGenerationRuns)
          .where(eq(contentGenerationRuns.id, row.id))
          .get()

        const result = await db
          .update(contentGenerationRuns)
          .set({
            status: 'running',
            leaseToken: token,
            leaseExpiresAt: expiresAt,
            heartbeatAt: now,
            startedAt: current?.startedAt ?? now,
            updatedAt: now,
          })
          .where(and(
            eq(contentGenerationRuns.id, row.id),
            inArray(contentGenerationRuns.status, ['queued', 'running']),
            or(
              isNull(contentGenerationRuns.leaseExpiresAt),
              lte(contentGenerationRuns.leaseExpiresAt, now),
            ),
          ))
          .returning({ id: contentGenerationRuns.id })
          .all()

        if (result.length > 0) {
          claimed.push(row.id)
        }
      }

      return claimed
    },

    async processRunOnce(runId: string) {
      const run = await this.findById(runId)
      if (!run) {
        throw queryNotFound('Generation run not found')
      }

      const nextStep = run.steps?.find(step => step.status === 'pending' || step.status === 'running')
      if (!nextStep) {
        const now = new Date().toISOString()
        await db
          .update(contentGenerationRuns)
          .set({
            status: 'awaiting_review',
            leaseToken: null,
            leaseExpiresAt: null,
            finishedAt: now,
            updatedAt: now,
          })
          .where(eq(contentGenerationRuns.id, runId))

        const articleId = run.articleId
        const recipeId = run.recipeId
        if (run.targetType === 'article' && articleId) {
          await db
            .update(schema.articles)
            .set({ requiresHumanReview: true, updatedAt: now })
            .where(eq(schema.articles.id, articleId))
        }
        if (run.targetType === 'recipe' && recipeId) {
          await db
            .update(schema.recipes)
            .set({ requiresHumanReview: true, updatedAt: now })
            .where(eq(schema.recipes.id, recipeId))
        }

        await runtime.progress.set({
          runId,
          stepKey: 'awaiting_review',
          status: 'succeeded',
          updatedAt: now,
        })

        return { runId, advanced: false, completed: true }
      }

      const now = new Date().toISOString()
      await runtime.progress.set({
        runId,
        stepKey: nextStep.stepKey,
        status: 'running',
        updatedAt: now,
      })

      await db
        .update(contentGenerationRunSteps)
        .set({
          status: 'running',
          startedAt: nextStep.startedAt ?? now,
          attemptCount: (nextStep.attemptCount ?? 0) + 1,
          updatedAt: now,
        })
        .where(eq(contentGenerationRunSteps.id, nextStep.id))

      const stepResult = await executeGenerationStep(db, runtime.artifacts, {
        id: run.id,
        targetType: run.targetType,
        articleId: run.articleId,
        recipeId: run.recipeId,
        artifactPrefix: run.artifactPrefix,
        requestedByUserId: run.requestedByUserId,
      }, nextStep.stepKey)

      if (stepResult.linkedArticleId) {
        await db
          .update(contentGenerationRuns)
          .set({ articleId: stepResult.linkedArticleId, updatedAt: now })
          .where(eq(contentGenerationRuns.id, runId))
      }
      if (stepResult.linkedRecipeId) {
        await db
          .update(contentGenerationRuns)
          .set({ recipeId: stepResult.linkedRecipeId, updatedAt: now })
          .where(eq(contentGenerationRuns.id, runId))
      }

      await db
        .update(contentGenerationRunSteps)
        .set({
          status: 'succeeded',
          artifactKey: stepResult.artifactKey,
          finishedAt: now,
          updatedAt: now,
        })
        .where(eq(contentGenerationRunSteps.id, nextStep.id))

      await db
        .update(contentGenerationRuns)
        .set({
          heartbeatAt: now,
          leaseExpiresAt: new Date(Date.now() + LEASE_MS).toISOString(),
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))

      await runtime.progress.set({
        runId,
        stepKey: nextStep.stepKey,
        status: 'succeeded',
        updatedAt: now,
      })

      return { runId, advanced: true, stepKey: nextStep.stepKey, completed: false }
    },

    async approveRun(runId: string, reviewerUserId: number, reviewNote?: string | null) {
      const run = await this.findById(runId)
      if (!run) {
        throw queryNotFound('Generation run not found')
      }

      if (run.status !== 'awaiting_review') {
        throw queryConflict('Only runs awaiting human review can be approved')
      }

      const steps = run.steps ?? []
      const pipelineComplete = steps.length > 0 && steps.every(step =>
        step.status === 'succeeded' || step.status === 'skipped',
      )
      if (!pipelineComplete) {
        throw queryConflict('Generation pipeline has not finished successfully')
      }

      if (run.requestedByUserId && run.requestedByUserId === reviewerUserId) {
        throw queryConflict('The requester cannot approve their own generation run')
      }

      const now = new Date().toISOString()
      let reviewedArticleVersion: number | null = null
      let reviewedRecipeVersion: number | null = null

      if (run.targetType === 'article' && run.articleId) {
        const article = await db.select().from(schema.articles).where(eq(schema.articles.id, run.articleId)).get()
        reviewedArticleVersion = article?.version ?? null
      }
      if (run.targetType === 'recipe' && run.recipeId) {
        const recipe = await db.select().from(schema.recipes).where(eq(schema.recipes.id, run.recipeId)).get()
        reviewedRecipeVersion = recipe?.version ?? null
      }

      await db
        .update(contentGenerationRuns)
        .set({
          status: 'approved',
          reviewedAt: now,
          reviewedByUserId: reviewerUserId,
          reviewedArticleVersion,
          reviewedRecipeVersion,
          reviewNote: reviewNote ?? null,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))

      return this.findById(runId)
    },

    async findApprovedVersionMatch(input: {
      targetType: GenerationTargetType
      articleId?: number | null
      recipeId?: number | null
      version: number
    }) {
      if (input.targetType === 'article' && input.articleId) {
        return db
          .select()
          .from(contentGenerationRuns)
          .where(and(
            eq(contentGenerationRuns.articleId, input.articleId),
            eq(contentGenerationRuns.status, 'approved'),
            eq(contentGenerationRuns.reviewedArticleVersion, input.version),
          ))
          .orderBy(sql`${contentGenerationRuns.reviewedAt} DESC`)
          .get()
      }

      if (input.targetType === 'recipe' && input.recipeId) {
        return db
          .select()
          .from(contentGenerationRuns)
          .where(and(
            eq(contentGenerationRuns.recipeId, input.recipeId),
            eq(contentGenerationRuns.status, 'approved'),
            eq(contentGenerationRuns.reviewedRecipeVersion, input.version),
          ))
          .orderBy(sql`${contentGenerationRuns.reviewedAt} DESC`)
          .get()
      }

      return undefined
    },
  }
}
