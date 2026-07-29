import type { H3Event } from 'h3'
import type {
  StrapiImportLock,
  StrapiImportProgress,
  StrapiImportResult,
} from '../../shared/strapi-import'
import { invalidateStrapiImportCoverage } from './strapi-import-coverage'
import { useKv, useKvStore } from '../utils/kv'

const STATUS_KEY = 'strapi-import:status'
const LOCK_KEY = 'strapi-import:lock'
const STATUS_TTL = 60 * 60 * 24
const LOCK_TTL = 60 * 15
const STALE_LOCK_MS = 30 * 60 * 1000

/** Process-local mutex for dev (memory KV is single-process). */
const memoryLockOwner = { id: null as string | null }

function isStaleLock(lock: StrapiImportLock) {
  return Date.now() - new Date(lock.acquiredAt).getTime() > STALE_LOCK_MS
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

export async function resetStrapiImportState(event?: H3Event) {
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
  await setStrapiImportStatus(event, {
    status: 'failed',
    dryRun,
    finishedAt: new Date().toISOString(),
    error,
    messages: messages.slice(-200),
  })
  await releaseStrapiImportLock(event, lockId)
}
