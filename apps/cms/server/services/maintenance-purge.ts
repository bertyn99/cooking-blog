import type { H3Event } from 'nitro/h3'
import { createMaintenanceQueries } from '../db/queries/maintenance'
import type { AppDb } from '../db/create-db'
import type {
  MaintenancePurgeResult,
  MaintenancePurgeTarget,
} from '../../shared/maintenance'
import { useMediaStorage } from '../utils/media-storage'
import { purgeAllMediaImageCache } from '../utils/workers-image-cache'
import { useDb } from '../utils/db'
import { getStrapiImportStatus, resetStrapiImportState } from './strapi-import-status'

export function createMaintenanceService(db: AppDb) {
  const maintenance = createMaintenanceQueries(db)
  return {
    getCounts: () => maintenance.getCounts(),
    countRowsForTargets: (targets: MaintenancePurgeTarget[]) =>
      maintenance.countRowsForTargets(targets),
    runPurge: (targets: MaintenancePurgeTarget[], event?: H3Event) =>
      runMaintenancePurge(db, targets, event),
  }
}

export function useMaintenanceService(event?: H3Event) {
  return createMaintenanceService(useDb(event))
}

export async function runMaintenancePurge(
  db: AppDb,
  targets: MaintenancePurgeTarget[],
  event?: H3Event,
): Promise<MaintenancePurgeResult> {
  const maintenance = createMaintenanceQueries(db)
  const { deleted, mediaPathnames } = await maintenance.purgeTargets(targets)

  if (mediaPathnames.length && event) {
    const storage = useMediaStorage(event)
    for (const pathname of mediaPathnames) {
      try {
        await storage.del(pathname)
      }
      catch {
        // Object may already be missing from R2/local disk
      }
    }
    await purgeAllMediaImageCache(event)
  }

  if (event) {
    const importStatus = await getStrapiImportStatus(event)
    if (importStatus.status === 'running') {
      await resetStrapiImportState(event)
    }
  }

  return { deleted }
}
