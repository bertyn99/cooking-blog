import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireAdmin } from '../../utils/http-auth'

const MAX_PAGE_SIZE = 100
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / MAX_PAGE_SIZE)

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)

function queryPositiveInt(fallback: number, max: number) {
  return z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform((value) => Number(value))
    .pipe(z.number().int().positive().finite().max(max))
    .optional()
    .default(fallback)
}

const mcpLogsQuerySchema = z.object({
  page: queryPositiveInt(1, MAX_PAGE),
  pageSize: queryPositiveInt(25, MAX_PAGE_SIZE),
  action: optionalTrimmed,
  entityType: optionalTrimmed,
  keyPrefix: optionalTrimmed,
  from: optionalTrimmed,
  to: optionalTrimmed,
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parsed = mcpLogsQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid MCP logs query', parsed.error.flatten())
  }

  const query = parsed.data
  return useQueries(event).auditEvents.listMcpLogs({
    page: query.page,
    pageSize: query.pageSize,
    action: query.action,
    entityType: query.entityType,
    keyPrefix: query.keyPrefix,
    from: query.from,
    to: query.to,
  })
})
