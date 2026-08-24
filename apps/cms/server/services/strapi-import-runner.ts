import type { H3Event } from 'nitro/h3'
import type { StrapiImportContinuation, StrapiImportRunBody } from '../../shared/strapi-import'
import { runStrapiImport } from './extract/orchestrator'
import {
  appendStrapiImportLog,
  completeStrapiImport,
  failStrapiImport,
  getStrapiImportStatus,
  refreshStrapiImportLock,
  setStrapiImportStatus,
} from './strapi-import-status'
import { useDb } from '../utils/db'

export type StrapiImportJobOutcome = {
  result: Awaited<ReturnType<typeof runStrapiImport>>
  partial: boolean
}

export async function executeStrapiImportJob(
  event: H3Event | undefined,
  input: Required<Pick<StrapiImportRunBody, 'dryRun'>> & StrapiImportRunBody,
  lockId: string,
): Promise<StrapiImportJobOutcome | undefined> {
  const config = useRuntimeConfig(event)
  const db = useDb(event)
  const current = await getStrapiImportStatus(event)
  const startedAt = current.startedAt ?? new Date().toISOString()
  const messages: string[] = []

  if (input.continuation) {
    const refreshed = await refreshStrapiImportLock(event, lockId)
    if (!refreshed) {
      await failStrapiImport(
        event,
        'Verrou d’import expiré ou invalide.',
        ['Verrou d’import expiré ou invalide.'],
        input.dryRun,
        lockId,
      )
      return undefined
    }
  }

  try {
    const result = await runStrapiImport({
      db,
      strapiUrl: config.strapiUrl,
      strapiApiToken: config.strapiApiToken || undefined,
      strapiUploadsOrigin: config.strapiUploadsOrigin || undefined,
      dryRun: input.dryRun,
      steps: input.steps,
      slugFilter: input.slugFilter,
      omitDependencies: input.omitDependencies,
      continuation: input.continuation,
      lockId,
      event,
      onStepStart: async (step) => {
        await appendStrapiImportLog(event, `Démarrage : ${step}`, {
          status: 'running',
          dryRun: input.dryRun,
          startedAt,
          currentStep: step,
        }, lockId)
      },
      onLog: async (message) => {
        messages.push(message)
        await appendStrapiImportLog(event, message, {
          status: 'running',
          dryRun: input.dryRun,
          startedAt,
        }, lockId)
      },
    })

    if (result.continuation) {
      const latest = await getStrapiImportStatus(event)
      await setStrapiImportStatus(event, {
        ...latest,
        status: 'running',
        dryRun: result.dryRun,
        startedAt,
        currentStep: result.continuation.steps[result.continuation.stepIndex],
        result,
      })
      await refreshStrapiImportLock(event, lockId)
      return { result, partial: true }
    }

    await completeStrapiImport(event, result, lockId)
    return { result, partial: false }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await failStrapiImport(event, message, [...messages, message], input.dryRun, lockId)
    return undefined
  }
}

/** Run until completion (CLI / Nitro task). Loops Worker-sized units. */
export async function executeStrapiImportToCompletion(
  event: H3Event | undefined,
  input: Required<Pick<StrapiImportRunBody, 'dryRun'>> & StrapiImportRunBody,
  lockId: string,
): Promise<StrapiImportJobOutcome | undefined> {
  let continuation: StrapiImportContinuation | undefined
  let last: StrapiImportJobOutcome | undefined

  do {
    const jobInput: Required<Pick<StrapiImportRunBody, 'dryRun'>> & StrapiImportRunBody = continuation
      ? {
          dryRun: continuation.dryRun,
          continuation,
          omitDependencies: true,
        }
      : input

    last = await executeStrapiImportJob(event, jobInput, lockId)
    if (!last) return undefined
    continuation = last.partial ? last.result.continuation : undefined
  } while (continuation)

  return last
}

export async function primeStrapiImportStatus(
  event: H3Event | undefined,
  dryRun: boolean,
) {
  const startedAt = new Date().toISOString()
  await setStrapiImportStatus(event, {
    status: 'running',
    dryRun,
    startedAt,
    messages: [`Import démarré (${dryRun ? 'simulation' : 'écriture'})…`],
  })
  return startedAt
}
