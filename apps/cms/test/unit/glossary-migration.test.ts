import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@libsql/client'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { splitMigrationStatements } from '../../server/db/migrate-local'

const migrationPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../server/db/migrations/sqlite/20261012180000_glossary_terms/migration.sql',
)

const SCHEMA = `
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  locale TEXT DEFAULT 'fr' NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  deleted_at TEXT
);
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  qty REAL,
  unit TEXT DEFAULT 'none',
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE recipe_utensils (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  affiliate_url TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE seo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  recipe_id INTEGER,
  page_id INTEGER,
  description TEXT,
  keywords TEXT,
  canonical_url TEXT,
  meta_robots TEXT DEFAULT 'index, follow'
);
CREATE TABLE blobs (pathname TEXT PRIMARY KEY);
CREATE TABLE articles (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE pages (id INTEGER PRIMARY KEY AUTOINCREMENT);
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT);
`

async function applyGlossaryMigration(url: string) {
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

describe('glossary terms migration', () => {
  let tempDir = ''
  let dbUrl = ''

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'glossary-mig-'))
    dbUrl = `file:${join(tempDir, 'sqlite.db')}`
    const client = createClient({ url: dbUrl })
    try {
      await client.executeMultiple(SCHEMA)
      await client.execute("INSERT INTO recipes (title, slug) VALUES ('Tarte', 'tarte')")
      await client.execute("INSERT INTO ingredients (recipe_id, name, qty, unit, sort_order) VALUES (1, 'Farine', 200, 'g', 0)")
      await client.execute("INSERT INTO ingredients (recipe_id, name, qty, unit, sort_order) VALUES (1, 'farine', 50, 'g', 1)")
      await client.execute("INSERT INTO ingredients (recipe_id, name, qty, unit, sort_order) VALUES (1, 'farine de blé', 100, 'g', 2)")
      await client.execute("INSERT INTO ingredients (recipe_id, name, qty, unit, sort_order) VALUES (1, 'sel (pincée)', NULL, 'none', 3)")
      await client.execute("INSERT INTO recipe_utensils (recipe_id, name, note, affiliate_url, sort_order) VALUES (1, 'Fouet', 'inoxydable', 'https://example.com/fouet', 0)")
    }
    finally {
      client.close()
    }
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('creates glossary stubs, links ingredients and utensils, and drops name columns', async () => {
    await applyGlossaryMigration(dbUrl)
    const client = createClient({ url: dbUrl })
    try {
      const terms = await client.execute('SELECT name, slug, kind, status, partner_url FROM glossary_terms ORDER BY sort_key')
      const names = terms.rows.map(row => String(row.name))
      expect(names).toContain('Farine')
      expect(names).toContain('farine de blé')
      expect(names).toContain('sel')
      expect(names).toContain('Fouet')
      expect(names.filter(name => name.toLowerCase() === 'farine')).toHaveLength(1)
      expect(terms.rows.some(row => row.kind === 'ustensile' && row.partner_url === 'https://example.com/fouet')).toBe(true)

      const seo = await client.execute("SELECT meta_robots FROM seo WHERE glossary_term_id IS NOT NULL")
      expect(seo.rows.every(row => row.meta_robots === 'noindex,follow')).toBe(true)

      const ingredients = await client.execute('SELECT glossary_term_id, note FROM ingredients')
      expect(ingredients.rows).toHaveLength(4)
      expect(ingredients.rows.some(row => row.note === 'pincée')).toBe(true)

      const columns = await client.execute('PRAGMA table_info(ingredients)')
      expect(columns.rows.map(row => row.name)).not.toContain('name')
      expect(columns.rows.map(row => row.name)).toContain('glossary_term_id')

      const utensils = await client.execute('PRAGMA table_info(recipe_utensils)')
      const utensilCols = utensils.rows.map(row => String(row.name))
      expect(utensilCols).toContain('glossary_term_id')
      expect(utensilCols).not.toContain('name')
      expect(utensilCols).not.toContain('affiliate_url')

      const utensilRows = await client.execute('SELECT glossary_term_id, note FROM recipe_utensils')
      expect(utensilRows.rows).toHaveLength(1)
      expect(utensilRows.rows[0]?.note).toBe('inoxydable')
      expect(Number(utensilRows.rows[0]?.glossary_term_id)).toBeGreaterThan(0)
    }
    finally {
      client.close()
    }
  })

  it('can run again when glossary tables and columns already exist', async () => {
    await applyGlossaryMigration(dbUrl)
    await applyGlossaryMigration(dbUrl)

    const client = createClient({ url: dbUrl })
    try {
      const terms = await client.execute('SELECT name FROM glossary_terms')
      expect(terms.rows.map(row => String(row.name))).toContain('Farine')
      const columns = await client.execute('PRAGMA table_info(ingredients)')
      expect(columns.rows.map(row => row.name)).toContain('glossary_term_id')
      expect(columns.rows.map(row => row.name)).not.toContain('name')
      const ingredients = await client.execute('SELECT count(*) AS n FROM ingredients')
      expect(Number(ingredients.rows[0]?.n)).toBe(4)
      const utensils = await client.execute('SELECT count(*) AS n FROM recipe_utensils')
      expect(Number(utensils.rows[0]?.n)).toBe(1)
    }
    finally {
      client.close()
    }
  })

  it('is a no-op when Alchemy already created glossary_terms without ingredient names', async () => {
    const client = createClient({ url: dbUrl })
    try {
      await client.execute('DELETE FROM ingredients')
      await client.execute('DELETE FROM recipe_utensils')
      await client.execute(`
        CREATE TABLE glossary_terms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          content TEXT,
          cover_blob_pathname TEXT,
          cover_alt_text TEXT,
          cover_description TEXT,
          icon_key TEXT,
          utensil_category TEXT,
          brand TEXT,
          amazon_asin TEXT,
          partner_url TEXT,
          partner_name TEXT,
          related_article_id INTEGER,
          sort_key TEXT NOT NULL,
          status TEXT DEFAULT 'draft' NOT NULL,
          published_at TEXT,
          locale TEXT DEFAULT 'fr' NOT NULL,
          created_by_user_id INTEGER,
          updated_by_user_id INTEGER,
          deleted_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)
      await client.execute(`
        CREATE TABLE glossary_aliases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          glossary_term_id INTEGER NOT NULL,
          alias TEXT NOT NULL,
          alias_normalized TEXT NOT NULL,
          locale TEXT DEFAULT 'fr' NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `)
      await client.execute('ALTER TABLE seo ADD glossary_term_id INTEGER')
      await client.execute('ALTER TABLE ingredients ADD glossary_term_id INTEGER')
      await client.execute('ALTER TABLE ingredients ADD note TEXT')
      await client.execute('ALTER TABLE ingredients DROP COLUMN name')
      await client.execute("INSERT INTO glossary_terms (kind, name, slug, sort_key) VALUES ('ingredient', 'Farine', 'farine', 'farine')")
      await client.execute("INSERT INTO ingredients (recipe_id, qty, unit, sort_order, glossary_term_id) VALUES (1, 200, 'g', 0, 1)")
    }
    finally {
      client.close()
    }

    await applyGlossaryMigration(dbUrl)

    const check = createClient({ url: dbUrl })
    try {
      const ingredients = await check.execute('SELECT glossary_term_id, qty FROM ingredients')
      expect(ingredients.rows).toHaveLength(1)
      expect(Number(ingredients.rows[0]?.glossary_term_id)).toBe(1)
      expect(Number(ingredients.rows[0]?.qty)).toBe(200)
      const terms = await check.execute('SELECT count(*) AS n FROM glossary_terms')
      expect(Number(terms.rows[0]?.n)).toBe(1)
    }
    finally {
      await check.close()
    }
  })
})
