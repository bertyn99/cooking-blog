/**
 * Pull CMS content from a remote instance into local `.data/` via transfer API keys.
 *
 *   pnpm clone:prod -- --origin=https://admin.example.com --key=jdc_…
 *   pnpm clone:prod -- --dry-run --scopes=articles,media
 *
 * Origin / key can also come from CMS_CLONE_CMS_ORIGIN (or PROD_CMS_HOST) and CMS_TRANSFER_KEY.
 */
import { loadCmsCloneEnv } from '../server/db/clone/load-env'
import { pullTransferToLocal } from '../server/db/clone/transfer-pull'
import { getLocalDb } from '../server/db/client'
import { migrateLocalDb } from '../server/db/migrate-local'
import {
  API_KEY_SCOPES,
  normalizeApiKeyScopes,
  type ApiKeyScope,
} from '../shared/api-keys'
import { normalizeCmsOrigin } from '../shared/transfer-pull'

interface CloneArgs {
  dryRun: boolean
  scopes: ApiKeyScope[]
  limit: number
  origin?: string
  apiKey?: string
}

function parseArgs(argv: string[]): CloneArgs {
  let dryRun = false
  let scopes = [...API_KEY_SCOPES] as ApiKeyScope[]
  let limit = 50
  let origin: string | undefined
  let apiKey: string | undefined

  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '-n') {
      dryRun = true
      continue
    }
    if (arg.startsWith('--scopes=')) {
      scopes = normalizeApiKeyScopes(
        arg.slice('--scopes='.length).split(',').map(part => part.trim()),
      )
      continue
    }
    if (arg.startsWith('--limit=')) {
      const parsed = Number.parseInt(arg.slice('--limit='.length), 10)
      if (Number.isFinite(parsed) && parsed > 0) limit = parsed
      continue
    }
    if (arg.startsWith('--origin=')) {
      origin = arg.slice('--origin='.length).trim() || undefined
      continue
    }
    if (arg.startsWith('--key=')) {
      apiKey = arg.slice('--key='.length).trim() || undefined
    }
  }

  if (scopes.length === 0) {
    throw new Error('Provide at least one scope via --scopes=articles,recipes,media')
  }

  return { dryRun, scopes, limit, origin, apiKey }
}

function resolveCmsOrigin(cliOrigin?: string): string {
  const allowPrivate = true
  if (cliOrigin) {
    return normalizeCmsOrigin(cliOrigin, { allowPrivate })
  }
  const explicit = process.env.CMS_CLONE_CMS_ORIGIN?.trim()
    || process.env.CMS_BASE_URL?.trim()
  if (explicit) return normalizeCmsOrigin(explicit, { allowPrivate })

  const host = process.env.PROD_CMS_HOST?.trim()
  if (host) {
    return normalizeCmsOrigin(host, { allowPrivate })
  }

  throw new Error(
    'Pass --origin=https://… or set CMS_CLONE_CMS_ORIGIN / PROD_CMS_HOST.',
  )
}

async function main() {
  loadCmsCloneEnv()
  process.env.CMS_TRANSFER_ALLOW_LOCAL_ORIGIN ??= '1'

  const args = parseArgs(process.argv.slice(2))
  const apiKey = args.apiKey || process.env.CMS_TRANSFER_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      'Pass --key=jdc_… or set CMS_TRANSFER_KEY. Create the key in the source CMS (Clés API).',
    )
  }

  const origin = resolveCmsOrigin(args.origin)
  console.log(`[clone:prod] origin=${origin}`)
  console.log(`[clone:prod] scopes=${args.scopes.join(',')}`)
  if (args.dryRun) console.log('[clone:prod] dry-run — no local writes')

  if (!args.dryRun) {
    await migrateLocalDb()
  }

  const result = await pullTransferToLocal({
    db: getLocalDb(),
    client: {
      origin,
      apiKey,
      dryRun: args.dryRun,
    },
    scopes: args.scopes,
    limit: args.limit,
    onProgress: message => console.log(message),
  })

  console.log('[clone:prod] done', result.counts)
  if (!args.dryRun) {
    console.log('[clone:prod] run `pnpm dev:cms` — drafts and published content are included')
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[clone:prod] failed — ${message}`)
  process.exitCode = 1
})
