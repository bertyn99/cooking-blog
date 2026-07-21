import { canAccessAdminApi } from '../../../../shared/abilities'
import { getMaintenanceCounts } from '../../../services/maintenance-purge'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const db = useDb(event)
  const counts = await getMaintenanceCounts(db)

  return { counts }
})
