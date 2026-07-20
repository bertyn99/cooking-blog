import { canAccessAdminApi } from '../../../../shared/abilities'
import { getStrapiImportStatus, resetStrapiImportState } from '../../../services/strapi-import-status'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  await resetStrapiImportState(event)
  return { ok: true, status: await getStrapiImportStatus(event) }
})
