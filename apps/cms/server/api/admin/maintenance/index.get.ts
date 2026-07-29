import { canAccessMaintenance } from '../../../../shared/abilities'
import { useMaintenanceService } from '../../../services/maintenance-purge'
import { requireAbility } from '../../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessMaintenance)

  const counts = await useMaintenanceService(event).getCounts()

  return { counts }
})
