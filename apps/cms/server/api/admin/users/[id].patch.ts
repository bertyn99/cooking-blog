import { useLogger } from 'evlog'
import { updateStaffUserSchema } from '../../../../shared/validators/staff'
import { requireAdmin } from '../../../utils/http-auth'
import { createApiError } from '../../../utils/errors'
import { useStaffService } from '../../../services/staff-service'

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event)
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('VALIDATION_ERROR', 'Identifiant utilisateur invalide.')
  }

  const body = await readBody(event)
  const parsed = updateStaffUserSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Mise à jour invalide.', parsed.error.flatten())
  }

  const log = useLogger(event as Parameters<typeof useLogger>[0])
  const data = await useStaffService(event).update(id, session.user!.id, parsed.data)
  log.set({ staff: { action: 'update', targetUserId: id, patch: parsed.data } })

  return { data }
})
