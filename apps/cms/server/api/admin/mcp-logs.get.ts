import { requireAdmin } from '../../utils/http-auth'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(query.pageSize ?? '25'), 10) || 25))

  const result = await useQueries(event).auditEvents.listMcpLogs({
    page,
    pageSize,
    action: typeof query.action === 'string' ? query.action : undefined,
    entityType: typeof query.entityType === 'string' ? query.entityType : undefined,
    keyPrefix: typeof query.keyPrefix === 'string' ? query.keyPrefix : undefined,
    from: typeof query.from === 'string' ? query.from : undefined,
    to: typeof query.to === 'string' ? query.to : undefined,
  })

  return result
})
