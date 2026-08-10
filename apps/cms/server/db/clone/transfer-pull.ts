import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { sql } from 'drizzle-orm'
import type { AppDb } from '../create-db'
import type { ApiKeyScope } from '../../../shared/api-keys'
import { API_KEY_SCOPES } from '../../../shared/api-keys'

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

async function transferFetch(
  opts: TransferClientOptions,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${opts.origin.replace(/\/$/, '')}${path}`
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
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
  const response = await transferFetch(opts, `/api/transfer/media/file?${params}`)
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
  const primaryKey = options?.primaryKey ?? 'id'

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

export function createLocalMediaWriter(mediaRoot: string): TransferMediaWriter {
  return async (pathname, data) => {
    const full = join(mediaRoot, pathname)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, data)
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
  onProgress?: (message: string) => void
}): Promise<{ counts: Record<string, number> }> {
  const log = input.onProgress ?? (() => {})
  const dryRun = Boolean(input.client.dryRun)
  const limit = input.limit ?? 50
  const writeMedia = input.writeMedia
    ?? createLocalMediaWriter(input.mediaRoot ?? join(process.cwd(), '.data/media'))
  const counts: Record<string, number> = {}
  const scopes = API_KEY_SCOPES.filter(scope => input.scopes.includes(scope))
  const importingMedia = scopes.includes('media')
  const clearCoverBlob = !importingMedia

  // 1) Media first — articles/recipes reference blobs.pathname
  if (scopes.includes('media')) {
    let cursor: string | null = null
    let total = 0
    let downloaded = 0
    do {
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
      cursor = page.meta.nextCursor
      log(`[clone] media +${page.data.length} (total ${total}, files ${downloaded})`)
    } while (cursor)
    counts.media = total
    counts.mediaFiles = downloaded
  }

  if (scopes.includes('articles')) {
    let cursor: string | null = null
    let total = 0
    do {
      const page = await fetchTransferJsonPage<{
        data: Record<string, unknown>[]
        related: {
          seo: Record<string, unknown>[]
          categoryArticles: Record<string, unknown>[]
        }
        meta: PageMeta
      }>(input.client, '/api/transfer/articles', cursor, limit)

      if (!dryRun) {
        const articleIds = page.data
          .map(row => Number(row.id))
          .filter(id => Number.isFinite(id))

        await upsertByPrimaryKey(input.db, 'category_articles', page.related.categoryArticles, {
          uniqueSlugLocale: true,
        })
        await upsertByPrimaryKey(input.db, 'articles', page.data, {
          uniqueSlugLocale: true,
          clearCoverBlob,
        })
        await deleteSeoForArticles(input.db, articleIds)
        await upsertByPrimaryKey(input.db, 'seo', page.related.seo)
      }
      total += page.data.length
      cursor = page.meta.nextCursor
      log(`[clone] articles +${page.data.length} (total ${total})`)
    } while (cursor)
    counts.articles = total
  }

  if (scopes.includes('recipes')) {
    let cursor: string | null = null
    let total = 0
    do {
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
        const recipeIds = page.data
          .map(row => Number(row.id))
          .filter(id => Number.isFinite(id))

        await upsertByPrimaryKey(input.db, 'categories', page.related.categories, {
          uniqueSlugLocale: true,
        })
        await upsertByPrimaryKey(input.db, 'recipes', page.data, {
          uniqueSlugLocale: true,
          clearCoverBlob,
        })
        // Drop stale children then re-insert current source set.
        await deleteRecipeChildren(input.db, recipeIds)
        await deleteSeoForRecipes(input.db, recipeIds)
        await upsertByPrimaryKey(input.db, 'seo', page.related.seo)
        await upsertByPrimaryKey(input.db, 'ingredients', page.related.ingredients)
        await upsertByPrimaryKey(input.db, 'recipe_utensils', page.related.utensils)
        await upsertByPrimaryKey(input.db, 'nutrition', page.related.nutrition)
        await upsertByPrimaryKey(input.db, 'recipe_steps', page.related.steps)
      }
      total += page.data.length
      cursor = page.meta.nextCursor
      log(`[clone] recipes +${page.data.length} (total ${total})`)
    } while (cursor)
    counts.recipes = total
  }

  return { counts }
}
