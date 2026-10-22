import { canAccessImport } from '../../../../shared/abilities'
import { getStrapiImportStatus, resetStrapiImportState } from '../../../services/strapi-import-status'
import { requireAbility } from '../../../utils/http-auth'
import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessImport)

  await resetStrapiImportState(event)
  return { ok: true, status: await getStrapiImportStatus(event) }
})
