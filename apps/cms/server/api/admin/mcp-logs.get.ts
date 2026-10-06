import { z } from 'zod'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { requireAdmin } from '../../utils/http-auth'

const positiveIntString = z.string().regex(/^[1-9]\d*$/)
const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)

const mcpLogsQuerySchema = z.object({
  page: positiveIntString.optional().transform((value) => (value ? Number(value) : 1)),
  pageSize: positiveIntString.optional().transform((value) => (value ? Number(value) : 25)),
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
    pageSize: Math.min(100, query.pageSize),
    action: query.action,
    entityType: query.entityType,
    keyPrefix: query.keyPrefix,
    from: query.from,
    to: query.to,
  })
})
