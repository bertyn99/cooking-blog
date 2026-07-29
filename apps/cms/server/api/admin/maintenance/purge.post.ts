import { z } from 'zod'
import { canAccessMaintenance } from '../../../../shared/abilities'
import {
  MAINTENANCE_PURGE_CONFIRM_PHRASE,
  MAINTENANCE_PURGE_TARGETS,
} from '../../../../shared/maintenance'
import { useMaintenanceService } from '../../../services/maintenance-purge'
import { createApiError } from '../../../utils/errors'
import { requireAbility } from '../../../utils/http-auth'
import { validateBody } from '../../../utils/validate'

const bodySchema = z.object({
  targets: z.array(z.enum(MAINTENANCE_PURGE_TARGETS)).min(1),
  confirmPhrase: z.string(),
})

export default defineEventHandler(async (event) => {
  await requireAbility(event, canAccessMaintenance)

  const body = validateBody(bodySchema, await readBody(event))

  if (body.confirmPhrase !== MAINTENANCE_PURGE_CONFIRM_PHRASE) {
    throw createApiError(
      'VALIDATION_ERROR',
      `Saisissez « ${MAINTENANCE_PURGE_CONFIRM_PHRASE} » pour confirmer.`,
    )
  }

  const maintenance = useMaintenanceService(event)
  const targets = [...new Set(body.targets)]
  const affected = await maintenance.countRowsForTargets(targets)

  if (affected === 0) {
    return {
      ok: true,
      message: 'Rien à supprimer pour la sélection.',
      result: { deleted: {} },
      counts: await maintenance.getCounts(),
    }
  }

  const result = await maintenance.runPurge(targets, event)

  return {
    ok: true,
    message: 'Suppression terminée.',
    result,
    counts: await maintenance.getCounts(),
  }
})
