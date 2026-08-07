import { useLogger } from 'evlog'
import { createStaffUserSchema } from '../../../../shared/validators/staff'
import { requireAdmin } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { useStaffService } from '../../../services/staff-service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const parsed = createStaffUserSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Données utilisateur invalides.',
      parsed.error.flatten()
    )
  }

  const log = useLogger(event as Parameters<typeof useLogger>[0])
  const user = await useStaffService(event).create(parsed.data)
  log.set({ staff: { action: 'create', targetUserId: user.id, role: user.role } })

  return { data: user }
})
