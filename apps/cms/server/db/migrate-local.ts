import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createClient, type Client } from '@libsql/client'

const MIGRATIONS_TABLE = 'drizzle_migrations'

export interface MigrateLocalOptions {
  /** Skip console output. */
  silent?: boolean
  /** Override migrations directory (absolute or cwd-relative). */
  migrationsDir?: string
  /** Override libSQL database URL. */
  databaseUrl?: string
}

export interface MigrateLocalResult {
  applied: string[]
  skipped: string[]
}

function resolveMigrationsDir(cwd = process.cwd()) {
  return join(cwd, 'server/db/migrations/sqlite')
}

function resolveDatabaseUrl(cwd = process.cwd()) {
  return process.env.TURSO_DATABASE_URL
    || process.env.LIBSQL_URL
    || process.env.DATABASE_URL
    || `file:${join(cwd, '.data/db/sqlite.db')}`
}

function migrationSortKey(path: string) {
  const prefix = path.split('/')[0]?.split('_')[0] ?? path
  const numeric = Number.parseInt(prefix, 10)
  return Number.isNaN(numeric) ? null : numeric
}

export async function listMigrationFiles(migrationsDir: string): Promise<string[]> {
  const entries = await readdir(migrationsDir, { recursive: true })
  return entries
    .filter((name): name is string => typeof name === 'string' && name.endsWith('.sql'))
    .map(name => name.replaceAll('\\', '/'))
    .sort((a, b) => {
      const aNum = migrationSortKey(a)
      const bNum = migrationSortKey(b)
      if (aNum !== null && bNum !== null) return aNum - bNum
      if (aNum !== null) return -1
      if (bNum !== null) return 1
      return a.localeCompare(b)
    })
}

export function splitMigrationStatements(sql: string): string[] {
  return sql
    .split(/--> statement-breakpoint/g)
    .map(statement => statement.trim())
    .filter(Boolean)
}

async function ensureMigrationsTable(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `)
}

async function getAppliedMigrationNames(client: Client): Promise<Set<string>> {
  const result = await client.execute(`SELECT name FROM ${MIGRATIONS_TABLE}`)
  return new Set(result.rows.map(row => String(row.name)))
}

async function getNextMigrationSeq(client: Client): Promise<number> {
  const result = await client.execute(
    `SELECT MAX(CAST(id AS INTEGER)) AS max_id FROM ${MIGRATIONS_TABLE}`
  )
  const maxId = result.rows[0]?.max_id
  const parsed = Number(maxId ?? 0)
  return Number.isFinite(parsed) ? parsed + 1 : 1
}

async function ensureDatabaseFile(url: string) {
  if (!url.startsWith('file:')) return
  const filePath = url.slice('file:'.length)
  await mkdir(dirname(filePath), { recursive: true })
}

/**
 * Applies Drizzle/Alchemy migration SQL files to the local libSQL database
 * used by `pnpm dev:cms` when Cloudflare D1 bindings are unavailable.
 *
 * Uses the same `drizzle_migrations` tracking table as Alchemy D1 deploys.
 */
export async function migrateLocalDb(
  options: MigrateLocalOptions = {}
): Promise<MigrateLocalResult> {
  const cwd = process.cwd()
  const migrationsDir = options.migrationsDir ?? resolveMigrationsDir(cwd)
  const databaseUrl = options.databaseUrl ?? resolveDatabaseUrl(cwd)

  await ensureDatabaseFile(databaseUrl)

  const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
  })

  try {
    await ensureMigrationsTable(client)
    const appliedNames = await getAppliedMigrationNames(client)
    const files = await listMigrationFiles(migrationsDir)
    let nextSeq = await getNextMigrationSeq(client)

    const applied: string[] = []
    const skipped: string[] = []

    for (const migrationName of files) {
      if (appliedNames.has(migrationName)) {
        skipped.push(migrationName)
        continue
      }

      const sql = await readFile(join(migrationsDir, migrationName), 'utf8')
      const statements = splitMigrationStatements(sql)

      for (const statement of statements) {
        await client.execute(statement)
      }

      const migrationId = nextSeq.toString().padStart(5, '0')
      nextSeq += 1

      await client.execute({
        sql: `INSERT INTO ${MIGRATIONS_TABLE} (id, name, applied_at) VALUES (?, ?, datetime('now'))`,
        args: [migrationId, migrationName],
      })

      applied.push(migrationName)

      if (!options.silent) {
        const hash = createHash('sha256').update(sql).digest('hex').slice(0, 12)
        console.log(`[db:migrate:local] applied ${migrationName} (${hash})`)
      }
    }

    try {
      await client.execute('PRAGMA journal_mode = WAL')
      await client.execute('PRAGMA busy_timeout = 10000')
    }
    catch {
      // best-effort for local file DB
    }

    if (!options.silent) {
      if (applied.length === 0) {
        console.log(`[db:migrate:local] up to date (${databaseUrl})`)
      }
      else {
        console.log(`[db:migrate:local] done — ${applied.length} migration(s) applied`)
      }
    }

    return { applied, skipped }
  }
  finally {
    client.close()
  }
}
