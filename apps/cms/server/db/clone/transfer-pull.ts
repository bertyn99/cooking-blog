import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import type { ApiKeyScope } from '../../../shared/api-keys'
import { TRANSFER_SCOPES } from '../../../shared/api-keys'

export interface TransferClientOptions {
  origin: string
  apiKey: string
  dryRun?: boolean
}

export type TransferMediaWriter = (
  pathname: string,
  data: Buffer,
  contentType: string,
) => Promise<void>

type PageMeta = { nextCursor: string | null, limit: number }

const AUTHOR_FK_COLUMNS = new Set([
  'created_by_user_id',
  'updated_by_user_id',
  'createdByUserId',
  'updatedByUserId',
])

const REQUEST_TIMEOUT_MS = 30_000
const MEDIA_TIMEOUT_MS = 120_000
const MAX_PAGES = 500
const SAFE_IDENTIFIER = /^[a-z][a-z0-9_]*$/
const ALLOWED_TABLES = new Set([
  'articles',
  'blobs',
  'categories',
  'category_articles',
  'ingredients',
  'nutrition',
  'recipe_steps',
  'recipe_utensils',
  'recipes',
  'seo',
])

function assertSafeIdentifier(kind: string, value: string) {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(`Rejected unsafe ${kind} "${value}"`)
  }
}

function assertSafeTable(tableName: string) {
  assertSafeIdentifier('table', tableName)
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`Rejected unknown table "${tableName}"`)
  }
}

function assertSafeColumns(tableName: string, columns: string[]) {
  for (const column of columns) {
    assertSafeIdentifier(`column for ${tableName}`, column)
  }
}

function nextCursorOrStop(previous: string | null, page: {
  data: unknown[]
  meta: PageMeta
}): string | null {
  const next = page.meta.nextCursor
  if (!next || next === previous || page.data.length === 0) return null
  return next
}

async function transferFetch(
  opts: TransferClientOptions,
  path: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const url = `${opts.origin.replace(/\/$/, '')}${path}`
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      ...init?.headers,
    },
  })
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`${path} → refused redirect (${response.status})`)
  }
  if (response.type === 'opaqueredirect') {
    throw new Error(`${path} → refused opaque redirect`)
  }
  return response
}

async function transferFetchJson<T>(
  opts: TransferClientOptions,
  path: string,
): Promise<T> {
  const response = await transferFetch(opts, path, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${path} → HTTP ${response.status}: ${text.slice(0, 300)}`)
  }
  return response.json() as Promise<T>
}

export async function fetchTransferJsonPage<T extends { meta: PageMeta }>(
  opts: TransferClientOptions,
  path: string,
  cursor: string | null,
  limit = 50,
): Promise<T> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return transferFetchJson<T>(opts, `${path}?${params}`)
}

export async function downloadTransferMediaFile(
  opts: TransferClientOptions,
  pathname: string,
): Promise<{ buffer: ArrayBuffer, contentType: string }> {
  const params = new URLSearchParams({ pathname })
  const response = await transferFetch(
    opts,
    `/api/transfer/media/file?${params}`,
    undefined,
    MEDIA_TIMEOUT_MS,
  )
  if (!response.ok) {
    throw new Error(`media file ${pathname} → HTTP ${response.status}`)
  }
  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  }
}

export function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/** Drop remote user FKs — destination users are not part of the pull. */
export function sanitizeImportedRow(
  row: Record<string, unknown>,
  options?: { clearCoverBlob?: boolean },
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (AUTHOR_FK_COLUMNS.has(key)) {
      out[toSnake(key)] = null
      continue
    }
    const snake = toSnake(key)
    if (
      options?.clearCoverBlob
      && (snake === 'cover_blob_pathname' || snake === 'blob_pathname')
    ) {
      out[snake] = null
      continue
    }
    out[snake] = value !== null && typeof value === 'object'
      ? JSON.stringify(value)
      : value
  }
  return out
}

/**
 * Upsert by primary key only (avoids SQLite INSERT OR REPLACE wiping unrelated
 * unique-index collisions). Clears slug/locale conflicts for content tables.
 */
async function upsertByPrimaryKey(
  db: AppDb,
  tableName: string,
  rows: Record<string, unknown>[],
  options?: {
    primaryKey?: string
    uniqueSlugLocale?: boolean
    clearCoverBlob?: boolean
  },
) {
  if (!rows.length) return
  assertSafeTable(tableName)
  const primaryKey = options?.primaryKey ?? 'id'
  assertSafeIdentifier('primary key', primaryKey)

  for (const row of rows) {
    const prepared = sanitizeImportedRow(row, {
      clearCoverBlob: options?.clearCoverBlob,
    })
    const pkValue = prepared[primaryKey]
    if (pkValue === undefined || pkValue === null) {
      throw new Error(`Missing primary key "${primaryKey}" for ${tableName}`)
    }

    const columns = Object.keys(prepared)
    if (!columns.length) continue
    assertSafeColumns(tableName, columns)

    if (options?.uniqueSlugLocale) {
      const slug = prepared.slug
      const locale = prepared.locale
      if (typeof slug === 'string' && typeof locale === 'string') {
        await db.run(sql`
          DELETE FROM ${sql.raw(tableName)}
          WHERE "slug" = ${slug}
            AND "locale" = ${locale}
            AND ${sql.raw(`"${primaryKey}"`)} != ${pkValue}
        `)
      }
    }

    const placeholders = sql.join(
      columns.map(column => sql`${prepared[column]}`),
      sql`, `,
    )
    const columnSql = sql.raw(columns.map(column => `"${column}"`).join(', '))
    const updateColumns = columns.filter(column => column !== primaryKey)
    if (updateColumns.length === 0) {
      await db.run(sql`
        INSERT INTO ${sql.raw(tableName)} (${columnSql})
        VALUES (${placeholders})
        ON CONFLICT(${sql.raw(`"${primaryKey}"`)}) DO NOTHING
      `)
      continue
    }

    const updates = sql.join(
      updateColumns.map(column => sql`${sql.raw(`"${column}"`)} = excluded.${sql.raw(`"${column}"`)}`),
      sql`, `,
    )

    await db.run(sql`
      INSERT INTO ${sql.raw(tableName)} (${columnSql})
      VALUES (${placeholders})
      ON CONFLICT(${sql.raw(`"${primaryKey}"`)}) DO UPDATE SET ${updates}
    `)
  }
}

async function deleteRecipeChildren(db: AppDb, recipeIds: number[]) {
  if (!recipeIds.length) return
  const idList = sql.join(recipeIds.map(id => sql`${id}`), sql`, `)
  await db.run(sql`DELETE FROM ingredients WHERE recipe_id IN (${idList})`)
  await db.run(sql`DELETE FROM recipe_utensils WHERE recipe_id IN (${idList})`)
  await db.run(sql`DELETE FROM recipe_steps WHERE recipe_id IN (${idList})`)
  await db.run(sql`DELETE FROM nutrition WHERE recipe_id IN (${idList})`)
}

async function deleteSeoForArticles(db: AppDb, articleIds: number[]) {
  if (!articleIds.length) return
  const idList = sql.join(articleIds.map(id => sql`${id}`), sql`, `)
  await db.run(sql`DELETE FROM seo WHERE article_id IN (${idList})`)
}

async function deleteSeoForRecipes(db: AppDb, recipeIds: number[]) {
  if (!recipeIds.length) return
  const idList = sql.join(recipeIds.map(id => sql`${id}`), sql`, `)
  await db.run(sql`DELETE FROM seo WHERE recipe_id IN (${idList})`)
}

function rowIds(rows: Record<string, unknown>[]): number[] {
  return rows
    .map(row => Number(row.id))
    .filter(id => Number.isFinite(id))
}

/** Delete rows for parents that are not in the imported keep-set (safe on D1). */
async function deleteOrphans(
  db: AppDb,
  tableName: string,
  parentColumn: string,
  parentIds: number[],
  keepIds: number[],
) {
  assertSafeTable(tableName)
  assertSafeIdentifier('column', parentColumn)
  if (!parentIds.length) return
  const parentList = sql.join(parentIds.map(id => sql`${id}`), sql`, `)
  if (!keepIds.length) {
    await db.run(sql`
      DELETE FROM ${sql.raw(tableName)}
      WHERE ${sql.raw(`"${parentColumn}"`)} IN (${parentList})
    `)
    return
  }
  const keepList = sql.join(keepIds.map(id => sql`${id}`), sql`, `)
  await db.run(sql`
    DELETE FROM ${sql.raw(tableName)}
    WHERE ${sql.raw(`"${parentColumn}"`)} IN (${parentList})
      AND "id" NOT IN (${keepList})
  `)
}

async function importArticlePage(
  db: AppDb,
  page: {
    data: Record<string, unknown>[]
    related: {
      seo: Record<string, unknown>[]
      categoryArticles: Record<string, unknown>[]
    }
  },
  options: { clearCoverBlob: boolean, transactional: boolean },
) {
  const articleIds = rowIds(page.data)
  const write = async (writeDb: AppDb) => {
    await upsertByPrimaryKey(writeDb, 'category_articles', page.related.categoryArticles, {
      uniqueSlugLocale: true,
    })
    await upsertByPrimaryKey(writeDb, 'articles', page.data, {
      uniqueSlugLocale: true,
      clearCoverBlob: options.clearCoverBlob,
    })
    if (options.transactional) {
      // Atomic: wipe then re-insert is safe inside a libSQL transaction.
      await deleteSeoForArticles(writeDb, articleIds)
      await upsertByPrimaryKey(writeDb, 'seo', page.related.seo)
      return
    }
    // D1: upsert first so a mid-page failure never leaves articles without SEO.
    await upsertByPrimaryKey(writeDb, 'seo', page.related.seo)
    await deleteOrphans(writeDb, 'seo', 'article_id', articleIds, rowIds(page.related.seo))
  }

  if (options.transactional) {
    await db.transaction(async (tx) => {
      await write(tx as AppDb)
    })
    return
  }
  await write(db)
}

async function importRecipePage(
  db: AppDb,
  page: {
    data: Record<string, unknown>[]
    related: {
      seo: Record<string, unknown>[]
      categories: Record<string, unknown>[]
      ingredients: Record<string, unknown>[]
      utensils: Record<string, unknown>[]
      nutrition: Record<string, unknown>[]
      steps: Record<string, unknown>[]
    }
  },
  options: { clearCoverBlob: boolean, transactional: boolean },
) {
  const recipeIds = rowIds(page.data)
  const write = async (writeDb: AppDb) => {
    await upsertByPrimaryKey(writeDb, 'categories', page.related.categories, {
      uniqueSlugLocale: true,
    })
    await upsertByPrimaryKey(writeDb, 'recipes', page.data, {
      uniqueSlugLocale: true,
      clearCoverBlob: options.clearCoverBlob,
    })
    if (options.transactional) {
      await deleteRecipeChildren(writeDb, recipeIds)
      await deleteSeoForRecipes(writeDb, recipeIds)
      await upsertByPrimaryKey(writeDb, 'seo', page.related.seo)
      await upsertByPrimaryKey(writeDb, 'ingredients', page.related.ingredients)
      await upsertByPrimaryKey(writeDb, 'recipe_utensils', page.related.utensils)
      await upsertByPrimaryKey(writeDb, 'nutrition', page.related.nutrition)
      await upsertByPrimaryKey(writeDb, 'recipe_steps', page.related.steps)
      return
    }
    // D1: upsert replacements first, then prune orphans.
    await upsertByPrimaryKey(writeDb, 'seo', page.related.seo)
    await upsertByPrimaryKey(writeDb, 'ingredients', page.related.ingredients)
    await upsertByPrimaryKey(writeDb, 'recipe_utensils', page.related.utensils)
    await upsertByPrimaryKey(writeDb, 'nutrition', page.related.nutrition)
    await upsertByPrimaryKey(writeDb, 'recipe_steps', page.related.steps)
    await deleteOrphans(writeDb, 'seo', 'recipe_id', recipeIds, rowIds(page.related.seo))
    await deleteOrphans(writeDb, 'ingredients', 'recipe_id', recipeIds, rowIds(page.related.ingredients))
    await deleteOrphans(writeDb, 'recipe_utensils', 'recipe_id', recipeIds, rowIds(page.related.utensils))
    await deleteOrphans(writeDb, 'nutrition', 'recipe_id', recipeIds, rowIds(page.related.nutrition))
    await deleteOrphans(writeDb, 'recipe_steps', 'recipe_id', recipeIds, rowIds(page.related.steps))
  }

  if (options.transactional) {
    await db.transaction(async (tx) => {
      await write(tx as AppDb)
    })
    return
  }
  await write(db)
}

export function createLocalMediaWriter(mediaRoot: string): TransferMediaWriter {
  return async (pathname, data, contentType) => {
    const full = join(mediaRoot, pathname)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, data)
    if (contentType) {
      await writeFile(`${full}.content-type`, contentType, 'utf8')
    }
  }
}

/**
 * Pull scoped resources from a remote CMS transfer API into this instance's DB + media.
 * Media is imported first so content cover FKs succeed under foreign_keys=ON.
 */
export async function pullTransferToLocal(input: {
  db: AppDb
  client: TransferClientOptions
  scopes: ApiKeyScope[]
  /** Defaults to filesystem `.data/media` when omitted. */
  writeMedia?: TransferMediaWriter
  mediaRoot?: string
  limit?: number
  maxPages?: number
  /** D1 does not support SQL transactions — disable on deployed Workers. */
  transactionalWrites?: boolean
  onProgress?: (message: string) => void
}): Promise<{ counts: Record<string, number> }> {
  const log = input.onProgress ?? (() => {})
  const dryRun = Boolean(input.client.dryRun)
  const limit = input.limit ?? 50
  const maxPages = input.maxPages ?? MAX_PAGES
  const transactionalWrites = input.transactionalWrites ?? true
  const writeMedia = input.writeMedia
    ?? createLocalMediaWriter(input.mediaRoot ?? join(process.cwd(), '.data/media'))
  const counts: Record<string, number> = {}
  const scopes = TRANSFER_SCOPES.filter(scope => input.scopes.includes(scope))
  const importingMedia = scopes.includes('media')
  const clearCoverBlob = !importingMedia

  // 1) Media first — articles/recipes reference blobs.pathname
  if (scopes.includes('media')) {
    let cursor: string | null = null
    let total = 0
    let downloaded = 0
    let pages = 0
    do {
      pages += 1
      if (pages > maxPages) {
        throw new Error(`Transfer media exceeded max pages (${maxPages})`)
      }
      const previous = cursor
      const page = await fetchTransferJsonPage<{
        data: Array<Record<string, unknown> & { pathname: string, mimeType?: string | null }>
        meta: PageMeta
      }>(input.client, '/api/transfer/media', cursor, limit)

      if (!dryRun) {
        for (const item of page.data) {
          if (!item.pathname) continue
          const file = await downloadTransferMediaFile(input.client, item.pathname)
          await writeMedia(
            item.pathname,
            Buffer.from(file.buffer),
            item.mimeType || file.contentType,
          )
          // Catalog row only after the object exists on storage.
          await upsertByPrimaryKey(input.db, 'blobs', [item], { primaryKey: 'pathname' })
          downloaded += 1
        }
      }
      else {
        downloaded += page.data.length
      }
      total += page.data.length
      cursor = nextCursorOrStop(previous, page)
      log(`[clone] media +${page.data.length} (total ${total}, files ${downloaded})`)
    } while (cursor)
    counts.media = total
    counts.mediaFiles = downloaded
  }

  if (scopes.includes('articles')) {
    let cursor: string | null = null
    let total = 0
    let pages = 0
    do {
      pages += 1
      if (pages > maxPages) {
        throw new Error(`Transfer articles exceeded max pages (${maxPages})`)
      }
      const previous = cursor
      const page = await fetchTransferJsonPage<{
        data: Record<string, unknown>[]
        related: {
          seo: Record<string, unknown>[]
          categoryArticles: Record<string, unknown>[]
        }
        meta: PageMeta
      }>(input.client, '/api/transfer/articles', cursor, limit)

      if (!dryRun) {
        await importArticlePage(input.db, page, {
          clearCoverBlob,
          transactional: transactionalWrites,
        })
      }
      total += page.data.length
      cursor = nextCursorOrStop(previous, page)
      log(`[clone] articles +${page.data.length} (total ${total})`)
    } while (cursor)
    counts.articles = total
  }

  if (scopes.includes('recipes')) {
    let cursor: string | null = null
    let total = 0
    let pages = 0
    do {
      pages += 1
      if (pages > maxPages) {
        throw new Error(`Transfer recipes exceeded max pages (${maxPages})`)
      }
      const previous = cursor
      const page = await fetchTransferJsonPage<{
        data: Record<string, unknown>[]
        related: {
          seo: Record<string, unknown>[]
          categories: Record<string, unknown>[]
          ingredients: Record<string, unknown>[]
          utensils: Record<string, unknown>[]
          nutrition: Record<string, unknown>[]
          steps: Record<string, unknown>[]
        }
        meta: PageMeta
      }>(input.client, '/api/transfer/recipes', cursor, limit)

      if (!dryRun) {
        await importRecipePage(input.db, page, {
          clearCoverBlob,
          transactional: transactionalWrites,
        })
      }
      total += page.data.length
      cursor = nextCursorOrStop(previous, page)
      log(`[clone] recipes +${page.data.length} (total ${total})`)
    } while (cursor)
    counts.recipes = total
  }

  return { counts }
}
