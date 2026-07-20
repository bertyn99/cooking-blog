import type { H3Event } from 'h3'
import type { StrapiImportRunBody } from '../../shared/strapi-import'
import { runStrapiImport } from './extract/orchestrator'
import {
  appendStrapiImportLog,
  completeStrapiImport,
  failStrapiImport,
  setStrapiImportStatus,
} from './strapi-import-status'
import { useDb } from '../utils/db'

export async function executeStrapiImportJob(
  event: H3Event | undefined,
  input: Required<Pick<StrapiImportRunBody, 'dryRun'>> & StrapiImportRunBody,
  lockId: string,
) {
  const config = useRuntimeConfig(event)
  const db = useDb(event)
  const startedAt = new Date().toISOString()
  const messages: string[] = [`Import démarré (${input.dryRun ? 'simulation' : 'écriture'})…`]

  try {
    const result = await runStrapiImport({
      db,
      strapiUrl: config.strapiUrl,
      strapiApiToken: config.strapiApiToken || undefined,
      dryRun: input.dryRun,
      steps: input.steps,
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

    await completeStrapiImport(event, result, lockId)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await failStrapiImport(event, message, [...messages, message], input.dryRun, lockId)
  }
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
