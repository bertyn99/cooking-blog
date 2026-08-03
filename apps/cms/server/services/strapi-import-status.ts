import type { H3Event } from 'h3'
import type {
  StrapiImportBatchedStep,
  StrapiImportLock,
  StrapiImportProgress,
  StrapiImportResult,
} from '../../shared/strapi-import'
import { invalidateStrapiImportCoverage } from './strapi-import-coverage'
import { useKv, useKvStore } from '../utils/kv'

const STATUS_KEY = 'strapi-import:status'
const LOCK_KEY = 'strapi-import:lock'
const STATUS_TTL = 60 * 60 * 24
/** Refreshed on every continuation; keep generous for multi-request media imports. */
const LOCK_TTL = 60 * 30
const STALE_LOCK_MS = 60 * 60 * 1000
const JOB_SLUGS_TTL = 60 * 60 * 2

/** Process-local mutex for dev (memory KV is single-process). */
const memoryLockOwner = { id: null as string | null }

function isStaleLock(lock: StrapiImportLock) {
  return Date.now() - new Date(lock.acquiredAt).getTime() > STALE_LOCK_MS
}

function jobSlugsKey(lockId: string, step: StrapiImportBatchedStep) {
  return `strapi-import:slugs:${lockId}:${step}`
}

export async function getStrapiImportStatus(event?: H3Event): Promise<StrapiImportProgress> {
  const store = useKvStore(event)
  const current = await store.get<StrapiImportProgress>(STATUS_KEY)
  return current ?? {
    status: 'idle',
    dryRun: false,
    messages: [],
  }
}

export async function setStrapiImportStatus(
  event: H3Event | undefined,
  progress: StrapiImportProgress,
) {
  const store = useKvStore(event)
  await store.set(STATUS_KEY, progress, { ttl: STATUS_TTL })
}

export async function acquireStrapiImportLock(event?: H3Event): Promise<string | null> {
  const store = useKvStore(event)
  const usingMemory = !useKv(event)

  const existing = await store.get<StrapiImportLock>(LOCK_KEY)
  if (existing && !isStaleLock(existing)) {
    return null
  }
  if (existing && isStaleLock(existing)) {
    await store.del(LOCK_KEY)
    if (usingMemory) memoryLockOwner.id = null
  }

  if (usingMemory && memoryLockOwner.id) {
    return null
  }

  const lock: StrapiImportLock = {
    id: crypto.randomUUID(),
    acquiredAt: new Date().toISOString(),
  }

  if (usingMemory) {
    memoryLockOwner.id = lock.id
  }

  await store.set(LOCK_KEY, lock, { ttl: LOCK_TTL })

  const verify = await store.get<StrapiImportLock>(LOCK_KEY)
  if (verify?.id !== lock.id) {
    if (usingMemory && memoryLockOwner.id === lock.id) {
      memoryLockOwner.id = null
    }
    return null
  }

  return lock.id
}

/** Extend lock TTL while a multi-request import is still progressing. */
export async function refreshStrapiImportLock(
  event: H3Event | undefined,
  lockId: string,
): Promise<boolean> {
  const store = useKvStore(event)
  const existing = await store.get<StrapiImportLock>(LOCK_KEY)
  if (existing?.id !== lockId) {
    return false
  }
  const refreshed: StrapiImportLock = {
    id: lockId,
    acquiredAt: new Date().toISOString(),
  }
  await store.set(LOCK_KEY, refreshed, { ttl: LOCK_TTL })
  return true
}

export async function releaseStrapiImportLock(event: H3Event | undefined, lockId?: string) {
  const store = useKvStore(event)
  const usingMemory = !useKv(event)

  if (lockId) {
    const existing = await store.get<StrapiImportLock>(LOCK_KEY)
    if (existing?.id !== lockId) {
      return
    }
  }

  await store.del(LOCK_KEY)
  if (usingMemory && (!lockId || memoryLockOwner.id === lockId)) {
    memoryLockOwner.id = null
  }
}

export async function saveImportStepSlugs(
  event: H3Event | undefined,
  lockId: string,
  step: StrapiImportBatchedStep,
  slugs: string[],
) {
  const store = useKvStore(event)
  await store.set(jobSlugsKey(lockId, step), slugs, { ttl: JOB_SLUGS_TTL })
}

export async function loadImportStepSlugs(
  event: H3Event | undefined,
  lockId: string,
  step: StrapiImportBatchedStep,
): Promise<string[] | null> {
  const store = useKvStore(event)
  return store.get<string[]>(jobSlugsKey(lockId, step))
}

export async function clearImportJobSlugs(event: H3Event | undefined, lockId: string) {
  const store = useKvStore(event)
  for (const step of ['articles', 'recipes', 'pages'] as const) {
    await store.del(jobSlugsKey(lockId, step))
  }
}

export async function resetStrapiImportState(event?: H3Event) {
  const store = useKvStore(event)
  const lock = await store.get<StrapiImportLock>(LOCK_KEY)
  if (lock?.id) {
    await clearImportJobSlugs(event, lock.id)
  }
  await releaseStrapiImportLock(event)
  await setStrapiImportStatus(event, {
    status: 'idle',
    dryRun: false,
    messages: [],
  })
  await invalidateStrapiImportCoverage(event)
}

export async function appendStrapiImportLog(
  event: H3Event | undefined,
  message: string,
  patch?: Partial<StrapiImportProgress>,
  lockId?: string,
) {
  if (lockId) {
    const store = useKvStore(event)
    const currentLock = await store.get<StrapiImportLock>(LOCK_KEY)
    if (currentLock?.id !== lockId) {
      return
    }
  }

  const current = await getStrapiImportStatus(event)
  const next: StrapiImportProgress = {
    ...current,
    ...patch,
    messages: [...current.messages, message].slice(-200),
  }
  await setStrapiImportStatus(event, next)
}

export async function completeStrapiImport(
  event: H3Event | undefined,
  result: StrapiImportResult,
  lockId?: string,
) {
  if (lockId) {
    await clearImportJobSlugs(event, lockId)
  }
  await setStrapiImportStatus(event, {
    status: 'completed',
    dryRun: result.dryRun,
    finishedAt: result.finishedAt,
    messages: result.messages.slice(-200),
    result,
  })
  await releaseStrapiImportLock(event, lockId)
  await invalidateStrapiImportCoverage(event)
}

export async function failStrapiImport(
  event: H3Event | undefined,
  error: string,
  messages: string[],
  dryRun = false,
  lockId?: string,
) {
  if (lockId) {
    await clearImportJobSlugs(event, lockId)
  }
  await setStrapiImportStatus(event, {
    status: 'failed',
    dryRun,
    finishedAt: new Date().toISOString(),
    error,
    messages: messages.slice(-200),
  })
  await releaseStrapiImportLock(event, lockId)
}
