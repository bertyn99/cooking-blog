import { z } from 'zod'
import type { ContentWriteScope } from '../../../shared/api-keys'
import { scheduledAtIsoForDay } from '../../../shared/calendar'
import { createApiError } from '../../utils/errors'
import { createArticleSchema, updateArticleSchema } from '../../utils/validations/articles'
import { createRecipeSchema, updateRecipeSchema } from '../../utils/validations/recipes'
import { createPageSchema, updatePageSchema } from '../../utils/validations/pages'
import { createGlossaryTermSchema, updateGlossaryTermSchema } from '../../utils/validations/glossary'
import { createRecipeCategorySchema } from '../../utils/validations/categories'

export const MCP_READ_ONLY = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const

export const MCP_CREATE = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const

export const MCP_UPDATE = {
  readOnlyHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const

export const MCP_SCHEDULE = {
  readOnlyHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const

export const mcpIdInput = {
  id: z.number().int().positive().describe('Content id'),
}

export const mcpListInput = {
  locale: z.string().default('fr').describe('Locale (fr)'),
  page: z.number().int().min(1).default(1).describe('1-based page'),
  pageSize: z.number().int().min(1).max(100).default(20).describe('Items per page (max 100)'),
}

export const mcpContentStatusInput = {
  status: z.enum(['draft', 'published', 'scheduled']).optional()
    .describe('Filter by status; omit to list all'),
  search: z.string().optional().describe('Title/slug search'),
}

/** Planification input — full ISO datetime, or `YYYY-MM-DD` (published at 09:00 Europe/Paris). */
export const mcpScheduledAtInput = {
  scheduledAt: z.string().min(1)
    .describe('Publication datetime: ISO 8601 (2026-11-05T14:30:00Z) or a day key YYYY-MM-DD (published at 09:00 Europe/Paris)'),
}

/** Normalize `scheduledAt`: day keys become 09:00 Europe/Paris, datetimes become UTC ISO. */
export function resolveMcpScheduledAt(input: string): string {
  const dayKey = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim())
  if (dayKey) {
    return scheduledAtIsoForDay(input.trim())
  }
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    throw createApiError(
      'VALIDATION_ERROR',
      'scheduledAt invalide — utilisez un ISO 8601 (2026-11-05T14:30:00Z) ou un jour YYYY-MM-DD.',
    )
  }
  return parsed.toISOString()
}

export function mcpPagination(page: number, pageSize: number) {
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  }
}

export interface WritableOptions {
  /** Recipes: MCP may update live rows in place (since 2026-10-09). Status changes stay forbidden. */
  liveEditable?: boolean
}

export function withWritable<T extends { status: string }>(row: T, opts?: WritableOptions) {
  return { ...row, writable: Boolean(opts?.liveEditable) || row.status === 'draft' }
}

export function withWritableList<T extends { status: string }>(
  result: { data: T[], meta: unknown },
  opts?: WritableOptions,
) {
  return {
    ...result,
    data: result.data.map(row => withWritable(row, opts)),
  }
}

export function contentTypeToScope(
  contentType: 'article' | 'recipe' | 'page' | 'glossary',
): ContentWriteScope {
  switch (contentType) {
    case 'article':
      return 'articles'
    case 'recipe':
      return 'recipes'
    case 'page':
      return 'pages'
    case 'glossary':
      return 'glossary'
    default: {
      const _exhaustive: never = contentType
      return _exhaustive
    }
  }
}

export function generationTargetToScope(targetType: 'article' | 'recipe'): ContentWriteScope {
  switch (targetType) {
    case 'article':
      return 'articles'
    case 'recipe':
      return 'recipes'
    default: {
      const _exhaustive: never = targetType
      return _exhaustive
    }
  }
}

/** Draft-only MCP writes: never expose status / schedule / legacy `step`. */
export const mcpCreateArticleInput = createArticleSchema.omit({ status: true }).shape
export const mcpUpdateArticleInput = updateArticleSchema.omit({ status: true }).shape

export const mcpCreateRecipeInput = createRecipeSchema.omit({
  status: true,
  step: true,
}).shape
export const mcpUpdateRecipeInput = updateRecipeSchema.omit({
  status: true,
}).shape

export const mcpCreatePageInput = createPageSchema.omit({
  status: true,
  scheduledAt: true,
}).shape
export const mcpUpdatePageInput = updatePageSchema.omit({
  status: true,
  scheduledAt: true,
}).shape

export const mcpCreateGlossaryInput = createGlossaryTermSchema.omit({ status: true }).shape
export const mcpUpdateGlossaryInput = updateGlossaryTermSchema.omit({ status: true }).shape

/** Recipe categories: MCP creates drafts only — status/publishedAt are not agent-writable. */
export const mcpCreateRecipeCategoryInput = createRecipeCategorySchema.omit({
  status: true,
  publishedAt: true,
}).shape
