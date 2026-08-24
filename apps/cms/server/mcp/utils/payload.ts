import { z } from 'zod'
import type { ContentWriteScope } from '../../../shared/api-keys'
import { createArticleSchema, updateArticleSchema } from '../../utils/validations/articles'
import { createRecipeSchema, updateRecipeSchema } from '../../utils/validations/recipes'
import { createPageSchema, updatePageSchema } from '../../utils/validations/pages'

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

export function mcpPagination(page: number, pageSize: number) {
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  }
}

export function withWritable<T extends { status: string }>(row: T) {
  return { ...row, writable: row.status === 'draft' }
}

export function withWritableList<T extends { status: string }>(result: { data: T[], meta: unknown }) {
  return {
    ...result,
    data: result.data.map(withWritable),
  }
}

export function contentTypeToScope(
  contentType: 'article' | 'recipe' | 'page',
): ContentWriteScope {
  switch (contentType) {
    case 'article':
      return 'articles'
    case 'recipe':
      return 'recipes'
    case 'page':
      return 'pages'
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
  step: true,
}).shape

export const mcpCreatePageInput = createPageSchema.omit({
  status: true,
  scheduledAt: true,
}).shape
export const mcpUpdatePageInput = updatePageSchema.omit({
  status: true,
  scheduledAt: true,
}).shape
