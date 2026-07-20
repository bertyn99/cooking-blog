import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@libsql/client'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  listMigrationFiles,
  migrateLocalDb,
  splitMigrationStatements,
} from '../../server/db/migrate-local'

describe('splitMigrationStatements', () => {
  it('splits drizzle statement breakpoints', () => {
    expect(splitMigrationStatements('CREATE TABLE a;--> statement-breakpoint\nCREATE TABLE b;'))
      .toEqual(['CREATE TABLE a;', 'CREATE TABLE b;'])
  })
})

describe('migrateLocalDb', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cms-migrate-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('applies migration files and records them in drizzle_migrations', async () => {
    const migrationsDir = join(tempDir, 'migrations')
    await mkdir(join(migrationsDir, '0001_init'), { recursive: true })
    await writeFile(
      join(migrationsDir, '0001_init/migration.sql'),
      'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);'
    )

    const databaseUrl = `file:${join(tempDir, 'sqlite.db')}`

    const first = await migrateLocalDb({
      migrationsDir,
      databaseUrl,
      silent: true,
    })
    expect(first.applied).toEqual(['0001_init/migration.sql'])
    expect(first.skipped).toEqual([])

    const second = await migrateLocalDb({
      migrationsDir,
      databaseUrl,
      silent: true,
    })
    expect(second.applied).toEqual([])
    expect(second.skipped).toEqual(['0001_init/migration.sql'])

    const client = createClient({ url: databaseUrl })
    const users = await client.execute('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table', 'users'])
    expect(users.rows).toHaveLength(1)
    await client.close()
  })
})

describe('listMigrationFiles', () => {
  it('sorts migration folders by numeric timestamp prefix', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'cms-migrate-list-'))
    try {
      await mkdir(join(tempDir, '20260712175236_later'), { recursive: true })
      await mkdir(join(tempDir, '20260623123308_earlier'), { recursive: true })
      await writeFile(join(tempDir, '20260712175236_later/migration.sql'), '-- later')
      await writeFile(join(tempDir, '20260623123308_earlier/migration.sql'), '-- earlier')

      expect(await listMigrationFiles(tempDir)).toEqual([
        '20260623123308_earlier/migration.sql',
        '20260712175236_later/migration.sql',
      ])
    }
    finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
