import { z } from 'zod'
import { canAccessAdminApi } from '../../../../shared/abilities'
import {
  MAINTENANCE_PURGE_CONFIRM_PHRASE,
  MAINTENANCE_PURGE_TARGETS,
} from '../../../../shared/maintenance'
import {
  countRowsForTargets,
  getMaintenanceCounts,
  runMaintenancePurge,
} from '../../../services/maintenance-purge'
import { createApiError } from '../../../utils/errors'
import { useDb } from '../../../utils/db'
import { validateBody } from '../../../utils/validate'

const bodySchema = z.object({
  targets: z.array(z.enum(MAINTENANCE_PURGE_TARGETS)).min(1),
  confirmPhrase: z.string(),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)

  const body = validateBody(bodySchema, await readBody(event))

  if (body.confirmPhrase !== MAINTENANCE_PURGE_CONFIRM_PHRASE) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Saisissez « ${MAINTENANCE_PURGE_CONFIRM_PHRASE} » pour confirmer.`,
    )
  }

  const db = useDb(event)
  const targets = [...new Set(body.targets)]
  const affected = await countRowsForTargets(db, targets)

  if (affected === 0) {
    return {
      ok: true,
      message: 'Rien à supprimer pour la sélection.',
      result: { deleted: {} },
      counts: await getMaintenanceCounts(db),
    }
  }

  const result = await runMaintenancePurge(db, targets, event)

  return {
    ok: true,
    message: 'Suppression terminée.',
    result,
    counts: await getMaintenanceCounts(db),
  }
})
