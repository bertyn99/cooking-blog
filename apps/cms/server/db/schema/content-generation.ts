import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { articles } from './articles'
import { recipes } from './recipes'
import { users } from './users'

export const contentGenerationRuns = sqliteTable('content_generation_runs', {
  id: text('id').primaryKey(),
  targetType: text('target_type', { enum: ['article', 'recipe'] }).notNull(),
  articleId: integer('article_id').references(() => articles.id, { onDelete: 'restrict' }),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'restrict' }),
  artifactPrefix: text('artifact_prefix').notNull(),
  requestedByUserId: integer('requested_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['queued', 'running', 'awaiting_review', 'approved', 'rejected', 'failed', 'canceled'],
  }).notNull().default('queued'),
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  nextAttemptAt: text('next_attempt_at'),
  lastError: text('last_error', { mode: 'json' }),
  leaseToken: text('lease_token'),
  leaseExpiresAt: text('lease_expires_at'),
  heartbeatAt: text('heartbeat_at'),
  reviewedAt: text('reviewed_at'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  reviewedArticleVersion: integer('reviewed_article_version'),
  reviewedRecipeVersion: integer('reviewed_recipe_version'),
  reviewNote: text('review_note'),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('generation_runs_dispatch_idx').on(table.status, table.nextAttemptAt, table.leaseExpiresAt),
  index('generation_runs_article_idx').on(table.articleId, table.createdAt),
  index('generation_runs_recipe_idx').on(table.recipeId, table.createdAt),
])

export const contentGenerationRunSteps = sqliteTable('content_generation_run_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  runId: text('run_id').notNull().references(() => contentGenerationRuns.id, { onDelete: 'cascade' }),
  stepKey: text('step_key', {
    enum: ['normalize', 'classify', 'extract', 'assemble', 'validate', 'generate_cover'],
  }).notNull(),
  ordinal: integer('ordinal').notNull(),
  status: text('status', {
    enum: ['pending', 'running', 'succeeded', 'failed', 'skipped', 'canceled'],
  }).notNull().default('pending'),
  attemptCount: integer('attempt_count').notNull().default(0),
  idempotencyKey: text('idempotency_key').notNull(),
  artifactKey: text('artifact_key'),
  lastError: text('last_error', { mode: 'json' }),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex('generation_steps_run_key_idx').on(table.runId, table.stepKey),
  uniqueIndex('generation_steps_idempotency_idx').on(table.idempotencyKey),
  index('generation_steps_run_ordinal_idx').on(table.runId, table.ordinal),
])
