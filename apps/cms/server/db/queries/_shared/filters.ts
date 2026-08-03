import { and, eq, isNull, like, or, type SQL } from 'drizzle-orm'

export type ContentStatus = 'draft' | 'published' | 'scheduled'
export type AccessScope = 'public' | 'admin'

export interface ListScopeOptions {
  scope: AccessScope
  includeDeleted?: boolean
}

export function applyPublishedScope<T extends { status: unknown, deletedAt: unknown }>(
  table: T,
  opts: ListScopeOptions,
): SQL[] {
  const conditions: SQL[] = []

  if (opts.scope === 'public') {
    conditions.push(eq(table.status as never, 'published'))
    conditions.push(isNull(table.deletedAt as never))
  }
  else if (!opts.includeDeleted) {
    conditions.push(isNull(table.deletedAt as never))
  }

  return conditions
}

export function localeFilter<T extends { locale: unknown }>(table: T, locale?: string) {
  return locale ? eq(table.locale as never, locale) : undefined
}

export function statusFilter<T extends { status: unknown }>(table: T, status?: ContentStatus) {
  return status ? eq(table.status as never, status) : undefined
}

export function searchFilter<T extends { title?: unknown, slug?: unknown, name?: unknown }>(
  table: T,
  search?: string,
) {
  if (!search) return undefined
  const term = `%${search}%`
  const parts: SQL[] = []
  if ('title' in table && table.title) parts.push(like(table.title as never, term))
  if ('slug' in table && table.slug) parts.push(like(table.slug as never, term))
  if ('name' in table && table.name) parts.push(like(table.name as never, term))
  if (parts.length === 0) return undefined
  if (parts.length === 1) return parts[0]
  return or(...parts)
}

export function mergeConditions(...parts: Array<SQL | undefined>) {
  const conditions = parts.filter((part): part is SQL => part !== undefined)
  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)
}
