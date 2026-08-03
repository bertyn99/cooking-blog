/**
 * Hydrate Strapi `/uploads/…` media into local storage and rewrite content.
 * Runs in plain Node (no Cloudflare Worker subrequest limits).
 *
 *   pnpm media:hydrate
 *   pnpm media:hydrate -- --dry-run
 *   pnpm media:hydrate -- --slug=10-delicieuses-recettes-d-aperitif-portuguais-pour-l-ete
 *   pnpm media:hydrate -- --delay=500
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getLocalDb } from '../server/db/client'
import { hydrateStrapiMedia } from '../server/services/hydrate-strapi-media'

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function parseArgs(argv: string[]) {
  let dryRun = false
  let slug: string | undefined
  let delayMs = 250

  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '-n') {
      dryRun = true
      continue
    }
    if (arg.startsWith('--slug=')) {
      slug = arg.slice('--slug='.length).trim() || undefined
      continue
    }
    if (arg.startsWith('--delay=')) {
      const n = Number.parseInt(arg.slice('--delay='.length), 10)
      if (Number.isFinite(n) && n >= 0) delayMs = n
      continue
    }
  }

  return { dryRun, slug, delayMs }
}

async function main() {
  const root = process.cwd()
  loadEnvFile(resolve(root, '.env'))
  loadEnvFile(resolve(root, '../../.env'))

  const { dryRun, slug, delayMs } = parseArgs(process.argv.slice(2))
  const strapiUrl = process.env.STRAPI_URL || 'https://admin.journalducuistot.fr'
  const strapiApiToken = process.env.STRAPI_API_TOKEN || undefined
  const strapiUploadsOrigin = process.env.STRAPI_UPLOADS_ORIGIN || undefined

  const db = getLocalDb()
  const result = await hydrateStrapiMedia({
    db,
    strapiUrl,
    strapiApiToken,
    strapiUploadsOrigin,
    dryRun,
    slug,
    delayMs,
    log: (message) => console.log(`[media:hydrate] ${message}`),
  })

  if (result.media.errors > 0 || result.pendingUploadRefs > 0) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[media:hydrate] failed — ${message}`)
  process.exitCode = 1
})
