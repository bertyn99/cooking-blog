import { and, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import { queryConflict, queryNotFound } from '../../db/query-errors'
import {
  contentGenerationRunSteps,
  contentGenerationRuns,
} from '../schema/content-generation'
import { createArticleQueries } from './articles'
import { createRecipeQueries } from './recipes'
import { slugifyString } from '../../utils/slug'

/** Initial pipeline only (createRun inserts these). */
export const GENERATION_STEP_KEYS = [
  'normalize',
  'classify',
  'keyword_research',
  'extract',
  'assemble',
  'validate',
  'generate_cover',
] as const

/** Batch ebook parent: normalize then discover candidates. */
export const GENERATION_BATCH_STEP_KEYS = [
  'normalize',
  'discover',
] as const

export const GENERATION_REVISE_STEP_KEYS = ['revise_1', 'revise_2'] as const

export type GenerationPipelineStepKey = (typeof GENERATION_STEP_KEYS)[number]
export type GenerationBatchStepKey = (typeof GENERATION_BATCH_STEP_KEYS)[number]
export type GenerationReviseStepKey = (typeof GENERATION_REVISE_STEP_KEYS)[number]
export type GenerationStepKey
  = GenerationPipelineStepKey
    | GenerationBatchStepKey
    | GenerationReviseStepKey

export type GenerationTargetType = 'article' | 'recipe'
export type GenerationRunKind = 'unit' | 'batch'

export function reviseStepKeyForRound(round: number): GenerationReviseStepKey {
  if (round === 1) return 'revise_1'
  if (round === 2) return 'revise_2'
  throw new Error(`No revise step for review round ${round}`)
}

export interface AssembleRecipeFields {
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  servings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  ingredients?: Array<{ name: string, qty?: number, unit?: string, sortOrder?: number }>
  steps?: Array<{ title?: string, instruction: string, sortOrder?: number }>
  nutrition?: {
    lipides?: string
    proteine?: string
    sucre?: string
    calories?: string
    glucides?: string
    sodium?: string
  }
}

export interface AssembleDraftInput {
  title: string
  content?: string | null
  excerpt?: string | null
  locale: string
  recipeFields?: AssembleRecipeFields
}

const LEASE_MS = 120_000

const RETRY_BACKOFF_MS = [30_000, 120_000, 300_000] as const

function newLeaseToken() {
  return crypto.randomUUID()
}

export function generationRetryBackoffMs(attemptCount: number): number {
  const index = Math.max(0, attemptCount - 1)
  return RETRY_BACKOFF_MS[Math.min(index, RETRY_BACKOFF_MS.length - 1)] ?? 300_000
}

function serializeStepError(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error),
    at: new Date().toISOString(),
  }
}

async function applyAssembledDraft(
  db: AppDb,
  input: {
    targetType: GenerationTargetType
    articleId?: number | null
    recipeId?: number | null
    requestedByUserId?: number | null
    assemble: AssembleDraftInput
  },
): Promise<{ articleId?: number, recipeId?: number }> {
  const now = new Date().toISOString()
  const locale = input.assemble.locale || 'fr'

  if (input.targetType === 'article') {
    if (input.articleId) {
      await db
        .update(schema.articles)
        .set({
          title: input.assemble.title,
          content: input.assemble.content ?? null,
          excerpt: input.assemble.excerpt ?? null,
          requiresHumanReview: true,
          updatedAt: now,
          ...(input.requestedByUserId
            ? { updatedByUserId: input.requestedByUserId }
            : {}),
        })
        .where(eq(schema.articles.id, input.articleId))
      return { articleId: input.articleId }
    }

    const articles = createArticleQueries(db)
    const slug = await articles.reserveUniqueSlug(
      slugifyString(input.assemble.title),
      locale,
    )
    const article = await articles.insert({
      title: input.assemble.title,
      content: input.assemble.content ?? null,
      excerpt: input.assemble.excerpt ?? null,
      slug,
      locale,
      status: 'draft',
      requiresHumanReview: true,
      createdByUserId: input.requestedByUserId ?? null,
      updatedByUserId: input.requestedByUserId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    return { articleId: article?.id }
  }

  const recipePatch = {
    title: input.assemble.title,
    intro: input.assemble.content ?? null,
    excerpt: input.assemble.excerpt ?? null,
    prepTimeMinutes: input.assemble.recipeFields?.prepTimeMinutes,
    cookTimeMinutes: input.assemble.recipeFields?.cookTimeMinutes,
    servings: input.assemble.recipeFields?.servings,
    difficulty: input.assemble.recipeFields?.difficulty,
    requiresHumanReview: true,
    updatedAt: now,
    ...(input.requestedByUserId ? { updatedByUserId: input.requestedByUserId } : {}),
  }

  const recipeRelations = input.assemble.recipeFields
    ? {
        ingredients: input.assemble.recipeFields.ingredients,
        steps: input.assemble.recipeFields.steps,
        nutrition: input.assemble.recipeFields.nutrition,
      }
    : undefined

  if (input.recipeId) {
    const recipes = createRecipeQueries(db)
    await recipes.updateWithRelations(input.recipeId, recipePatch, recipeRelations ?? {})
    return { recipeId: input.recipeId }
  }

  const recipes = createRecipeQueries(db)
  const slug = await recipes.reserveUniqueSlug(slugifyString(input.assemble.title), locale)
  const recipe = await recipes.insert({
    title: input.assemble.title,
    intro: input.assemble.content ?? null,
    excerpt: input.assemble.excerpt ?? null,
    prepTimeMinutes: input.assemble.recipeFields?.prepTimeMinutes,
    cookTimeMinutes: input.assemble.recipeFields?.cookTimeMinutes,
    servings: input.assemble.recipeFields?.servings,
    difficulty: input.assemble.recipeFields?.difficulty,
    slug,
    locale,
    status: 'draft',
    requiresHumanReview: true,
    createdByUserId: input.requestedByUserId ?? null,
    updatedByUserId: input.requestedByUserId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  if (recipe?.id && recipeRelations) {
    await recipes.updateWithRelations(recipe.id, {}, recipeRelations)
  }

  return { recipeId: recipe?.id }
}

export function createContentGenerationQueries(db: AppDb) {
  return {
    findById(runId: string) {
      return db.query.contentGenerationRuns.findFirst({
        where: { id: runId },
        with: { steps: { orderBy: { ordinal: 'asc' } } },
      })
    },

    findRunLinkedIds(runId: string) {
      return db
        .select({
          articleId: contentGenerationRuns.articleId,
          recipeId: contentGenerationRuns.recipeId,
        })
        .from(contentGenerationRuns)
        .where(eq(contentGenerationRuns.id, runId))
        .get()
    },

    listForArticle(articleId: number) {
      return db
        .select()
        .from(contentGenerationRuns)
        .where(eq(contentGenerationRuns.articleId, articleId))
        .orderBy(sql`${contentGenerationRuns.createdAt} DESC`)
        .all()
    },

    listForRecipe(recipeId: number) {
      return db
        .select()
        .from(contentGenerationRuns)
        .where(eq(contentGenerationRuns.recipeId, recipeId))
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
      parentRunId?: string | null
      runKind?: GenerationRunKind
    }) {
      const now = new Date().toISOString()
      await db.insert(contentGenerationRuns).values({
        id: input.id,
        targetType: input.targetType,
        articleId: input.articleId ?? null,
        recipeId: input.recipeId ?? null,
        artifactPrefix: input.artifactPrefix,
        requestedByUserId: input.requestedByUserId ?? null,
        parentRunId: input.parentRunId ?? null,
        runKind: input.runKind ?? 'unit',
        reviewRound: 0,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      })

      await db.insert(contentGenerationRunSteps).values(
        (input.runKind === 'batch' ? GENERATION_BATCH_STEP_KEYS : GENERATION_STEP_KEYS).map(
          (stepKey, index) => ({
            runId: input.id,
            stepKey,
            ordinal: index,
            idempotencyKey: `${input.id}:${stepKey}`,
            status: 'pending' as const,
          }),
        ),
      )

      return this.findById(input.id)
    },

    listChildren(parentRunId: string) {
      return db
        .select()
        .from(contentGenerationRuns)
        .where(eq(contentGenerationRuns.parentRunId, parentRunId))
        .orderBy(sql`${contentGenerationRuns.createdAt} ASC`)
        .all()
    },

    async completeRunAwaitingSelection(runId: string) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'awaiting_selection',
          leaseToken: null,
          leaseExpiresAt: null,
          finishedAt: now,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))
    },

    async markBatchSelectionComplete(runId: string, selectedCount: number) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'approved',
          reviewNote: `${selectedCount} candidat(s) lancé(s)`,
          reviewedAt: now,
          finishedAt: now,
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))
      return this.findById(runId)
    },

    async claimRunnableRuns(limit = 5) {
      const now = new Date().toISOString()
      const candidates = await db
        .select({ id: contentGenerationRuns.id })
        .from(contentGenerationRuns)
        .where(and(
          inArray(contentGenerationRuns.status, ['queued', 'running', 'revising']),
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
            inArray(contentGenerationRuns.status, ['queued', 'running', 'revising']),
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

    async markStepRunning(stepId: number, attemptCount: number, startedAt: string | null) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRunSteps)
        .set({
          status: 'running',
          startedAt: startedAt ?? now,
          attemptCount,
          updatedAt: now,
        })
        .where(eq(contentGenerationRunSteps.id, stepId))
    },

    async markStepSucceeded(stepId: number, runId: string, artifactKey: string) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRunSteps)
        .set({
          status: 'succeeded',
          artifactKey,
          finishedAt: now,
          updatedAt: now,
        })
        .where(eq(contentGenerationRunSteps.id, stepId))

      await db
        .update(contentGenerationRuns)
        .set({
          heartbeatAt: now,
          nextAttemptAt: null,
          lastError: null,
          leaseExpiresAt: new Date(Date.now() + LEASE_MS).toISOString(),
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))
    },

    async linkRunContent(
      runId: string,
      linked: { articleId?: number | null, recipeId?: number | null },
    ) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          ...(linked.articleId !== undefined ? { articleId: linked.articleId } : {}),
          ...(linked.recipeId !== undefined ? { recipeId: linked.recipeId } : {}),
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))
    },

    async applyAssembledDraftAndLinkRun(
      runId: string,
      input: {
        targetType: GenerationTargetType
        articleId?: number | null
        recipeId?: number | null
        requestedByUserId?: number | null
        assemble: AssembleDraftInput
      },
    ) {
      return db.transaction(async (tx) => {
        const draft = await applyAssembledDraft(tx as AppDb, input)
        const now = new Date().toISOString()
        await tx
          .update(contentGenerationRuns)
          .set({
            articleId: draft.articleId ?? null,
            recipeId: draft.recipeId ?? null,
            updatedAt: now,
          })
          .where(eq(contentGenerationRuns.id, runId))
        return draft
      })
    },

    async completeRunAwaitingReview(
      runId: string,
      input: {
        targetType: GenerationTargetType
        articleId?: number | null
        recipeId?: number | null
        reviewRound?: number
      },
    ) {
      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'awaiting_review',
          reviewRound: input.reviewRound ?? 1,
          leaseToken: null,
          leaseExpiresAt: null,
          finishedAt: now,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))

      if (input.targetType === 'article' && input.articleId) {
        await db
          .update(schema.articles)
          .set({ requiresHumanReview: true, updatedAt: now })
          .where(eq(schema.articles.id, input.articleId))
      }
      if (input.targetType === 'recipe' && input.recipeId) {
        await db
          .update(schema.recipes)
          .set({ requiresHumanReview: true, updatedAt: now })
          .where(eq(schema.recipes.id, input.recipeId))
      }
    },

    async listAwaitingReview(input: {
      excludeRequestedByUserId?: number | null
      limit?: number
    } = {}) {
      const limit = input.limit ?? 50
      const conditions = [eq(contentGenerationRuns.status, 'awaiting_review')]
      if (input.excludeRequestedByUserId != null) {
        conditions.push(
          or(
            isNull(contentGenerationRuns.requestedByUserId),
            sql`${contentGenerationRuns.requestedByUserId} != ${input.excludeRequestedByUserId}`,
          )!,
        )
      }

      return db
        .select()
        .from(contentGenerationRuns)
        .where(and(...conditions))
        .orderBy(sql`${contentGenerationRuns.updatedAt} DESC`)
        .limit(limit)
        .all()
    },

    async countAwaitingReview(excludeRequestedByUserId?: number | null) {
      const conditions = [eq(contentGenerationRuns.status, 'awaiting_review')]
      if (excludeRequestedByUserId != null) {
        conditions.push(
          or(
            isNull(contentGenerationRuns.requestedByUserId),
            sql`${contentGenerationRuns.requestedByUserId} != ${excludeRequestedByUserId}`,
          )!,
        )
      }
      const row = await db
        .select({ count: sql<number>`count(*)` })
        .from(contentGenerationRuns)
        .where(and(...conditions))
        .get()
      return Number(row?.count ?? 0)
    },

    /**
     * Ensure revise_N step row exists (inserted on first request_changes for that gate).
     */
    async ensureReviseStep(runId: string, stepKey: GenerationReviseStepKey) {
      const existing = await db
        .select()
        .from(contentGenerationRunSteps)
        .where(and(
          eq(contentGenerationRunSteps.runId, runId),
          eq(contentGenerationRunSteps.stepKey, stepKey),
        ))
        .get()
      if (existing) {
        if (existing.status === 'succeeded' || existing.status === 'skipped') {
          // Allow a fresh revise attempt only if we reset — normally one revise per gate.
          return existing
        }
        if (existing.status === 'failed') {
          const now = new Date().toISOString()
          await db
            .update(contentGenerationRunSteps)
            .set({
              status: 'pending',
              lastError: null,
              finishedAt: null,
              startedAt: null,
              updatedAt: now,
            })
            .where(eq(contentGenerationRunSteps.id, existing.id))
          return { ...existing, status: 'pending' as const }
        }
        return existing
      }

      const maxOrdinal = await db
        .select({ max: sql<number>`max(${contentGenerationRunSteps.ordinal})` })
        .from(contentGenerationRunSteps)
        .where(eq(contentGenerationRunSteps.runId, runId))
        .get()
      const ordinal = Number(maxOrdinal?.max ?? GENERATION_STEP_KEYS.length - 1) + 1
      const now = new Date().toISOString()
      await db.insert(contentGenerationRunSteps).values({
        runId,
        stepKey,
        ordinal,
        idempotencyKey: `${runId}:${stepKey}`,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      return db
        .select()
        .from(contentGenerationRunSteps)
        .where(and(
          eq(contentGenerationRunSteps.runId, runId),
          eq(contentGenerationRunSteps.stepKey, stepKey),
        ))
        .get()
    },

    async rejectRun(runId: string, reviewerUserId: number, reason: string) {
      const run = await this.findById(runId)
      if (!run) {
        throw queryNotFound('Generation run not found')
      }
      if (run.status !== 'awaiting_review') {
        throw queryConflict('Only runs awaiting human review can be rejected')
      }
      if (run.requestedByUserId && run.requestedByUserId === reviewerUserId) {
        throw queryConflict('The requester cannot reject their own generation run')
      }

      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'rejected',
          reviewedAt: now,
          reviewedByUserId: reviewerUserId,
          reviewNote: reason,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))

      return this.findById(runId)
    },

    async requestChanges(runId: string, reviewerUserId: number, input: {
      reviewNote: string
      focusSteps?: string[] | null
    }) {
      const run = await this.findById(runId)
      if (!run) {
        throw queryNotFound('Generation run not found')
      }
      if (run.status !== 'awaiting_review') {
        throw queryConflict('Only runs awaiting human review can request changes')
      }
      if (run.requestedByUserId && run.requestedByUserId === reviewerUserId) {
        throw queryConflict('The requester cannot review their own generation run')
      }

      const round = run.reviewRound && run.reviewRound > 0 ? run.reviewRound : 1
      if (run.targetType !== 'article') {
        throw queryConflict('Revision rounds are only available for articles')
      }
      if (round > 2) {
        throw queryConflict('No remaining revision rounds for this run')
      }

      const stepKey = reviseStepKeyForRound(round)
      await this.ensureReviseStep(runId, stepKey)

      const now = new Date().toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'revising',
          reviewNote: input.reviewNote,
          reviewedByUserId: reviewerUserId,
          leaseToken: null,
          leaseExpiresAt: null,
          nextAttemptAt: null,
          finishedAt: null,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, runId))

      return {
        run: await this.findById(runId),
        round,
        stepKey,
        focusSteps: input.focusSteps ?? null,
      }
    },

    async markStepFailure(input: {
      stepId: number
      runId: string
      attemptCount: number
      maxAttempts: number
      error: unknown
      stepStartedAt: string | null
    }) {
      const now = new Date().toISOString()
      const errorPayload = serializeStepError(input.error)
      const terminalFailure = input.attemptCount >= input.maxAttempts

      await db
        .update(contentGenerationRunSteps)
        .set({
          status: terminalFailure ? 'failed' : 'pending',
          lastError: errorPayload,
          finishedAt: terminalFailure ? now : null,
          startedAt: terminalFailure ? input.stepStartedAt ?? now : null,
          updatedAt: now,
        })
        .where(eq(contentGenerationRunSteps.id, input.stepId))

      if (terminalFailure) {
        await db
          .update(contentGenerationRuns)
          .set({
            status: 'failed',
            lastError: errorPayload,
            leaseToken: null,
            leaseExpiresAt: null,
            finishedAt: now,
            updatedAt: now,
          })
          .where(eq(contentGenerationRuns.id, input.runId))

        return {
          terminal: true as const,
          error: errorPayload.message,
        }
      }

      const nextAttemptAt = new Date(Date.now() + generationRetryBackoffMs(input.attemptCount)).toISOString()
      await db
        .update(contentGenerationRuns)
        .set({
          status: 'queued',
          lastError: errorPayload,
          nextAttemptAt,
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(contentGenerationRuns.id, input.runId))

      return {
        terminal: false as const,
        error: errorPayload.message,
        nextAttemptAt,
      }
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
