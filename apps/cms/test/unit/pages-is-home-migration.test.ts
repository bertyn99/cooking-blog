import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@libsql/client'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { splitMigrationStatements } from '../../server/db/migrate-local'

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../server/db/migrations/sqlite/20260918190000_pages_is_home/migration.sql',
)

const PAGES_WITHOUT_IS_HOME = `
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title TEXT,
  slug TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  parent_id INTEGER,
  status TEXT DEFAULT 'draft' NOT NULL,
  first_published_at TEXT,
  published_at TEXT,
  scheduled_at TEXT,
  locale TEXT DEFAULT 'fr' NOT NULL,
  locale_group_id TEXT,
  version INTEGER DEFAULT 1 NOT NULL,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`

async function applyIsHomeMigration(url: string) {
  const sql = await readFile(migrationPath, 'utf8')
  const client = createClient({ url })
  try {
    for (const statement of splitMigrationStatements(sql)) {
      await client.execute(statement)
    }
  }
  finally {
    client.close()
  }
}

describe('pages is_home migration', () => {
  let tempDir: string
  let databaseUrl: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'pages-is-home-'))
    databaseUrl = `file:${join(tempDir, 'sqlite.db')}`
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('adds is_home on a table that does not have it (prod)', async () => {
    const client = createClient({ url: databaseUrl })
    await client.execute(PAGES_WITHOUT_IS_HOME)
    await client.execute(`INSERT INTO pages (name, slug) VALUES ('Accueil', 'accueil')`)
    client.close()

    await applyIsHomeMigration(databaseUrl)

    const check = createClient({ url: databaseUrl })
    const columns = await check.execute(`SELECT name FROM pragma_table_info('pages') WHERE name = 'is_home'`)
    expect(columns.rows).toHaveLength(1)
    const row = await check.execute(`SELECT is_home FROM pages WHERE slug = 'accueil'`)
    expect(row.rows[0]?.is_home).toBe(0)
    await check.close()
  })

  it('can run again when is_home already exists (local retry)', async () => {
    const client = createClient({ url: databaseUrl })
    await client.execute(PAGES_WITHOUT_IS_HOME)
    await client.execute(`INSERT INTO pages (name, slug) VALUES ('Accueil', 'accueil')`)
    client.close()

    await applyIsHomeMigration(databaseUrl)
    await applyIsHomeMigration(databaseUrl)

    const check = createClient({ url: databaseUrl })
    const columns = await check.execute(`SELECT name FROM pragma_table_info('pages') WHERE name = 'is_home'`)
    expect(columns.rows).toHaveLength(1)
    await check.close()
  })
})
