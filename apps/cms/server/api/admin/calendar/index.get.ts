import { z } from 'zod'
import { canEditContent } from '../../../../shared/abilities'
import { parseCalendarTypesParam } from '../../../../shared/calendar'
import { useCalendarService } from '../../../services/calendar-service'
import { createApiError } from '../../../utils/errors'
import { requireAbility } from '../../../utils/http-auth'

const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  locale: z.string().default('fr'),
  types: z.string().optional(),
  includePublished: z.enum(['true', 'false']).optional(),
  backlogLimit: z.coerce.number().int().min(1).max(100).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAbility(event, canEditContent)

  const parsed = calendarQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Invalid calendar query', parsed.error.flatten())
  }

  const query = parsed.data
  if (query.from > query.to) {
    throw createApiError('VALIDATION_ERROR', '`from` must be on or before `to`')
  }

  const includePublished = query.includePublished !== 'false'

  return useCalendarService(event).listForRange({
    from: query.from,
    to: query.to,
    locale: query.locale,
    types: parseCalendarTypesParam(query.types),
    includePublished,
    backlogLimit: query.backlogLimit ?? 50,
  })
})
