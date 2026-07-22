import { canAccessAdminApi } from '../../../../shared/abilities'
import { useMaintenanceService } from '../../../services/maintenance-purge'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const counts = await useMaintenanceService(event).getCounts()

  return { counts }
})
