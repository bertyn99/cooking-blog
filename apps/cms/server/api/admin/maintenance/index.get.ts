import { canAccessMaintenance } from '../../../../shared/abilities'
import type { MaintenanceStatusResponse } from '../../../../shared/maintenance'
import { useMaintenanceService } from '../../../services/maintenance-purge'
import { getStrapiImportStatus } from '../../../services/strapi-import-status'
import { resolveDatabaseSource } from '../../../utils/db'
import { requireAbility } from '../../../utils/http-auth'

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessMaintenance)

  const maintenance = useMaintenanceService(event)
  const [counts, importStatus] = await Promise.all([
    maintenance.getCounts(),
    getStrapiImportStatus(event),
  ])

  const body: MaintenanceStatusResponse = {
    counts,
    databaseSource: resolveDatabaseSource(event),
    strapiImportStatus: importStatus.status,
  }

  return body
})
