import { count, eq, inArray, isNotNull } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { AppDb } from '../db/create-db'
import { schema } from '../db/create-db'
import type {
  MaintenanceCounts,
  MaintenancePurgeResult,
  MaintenancePurgeTarget,
} from '../../shared/maintenance'
import { MAINTENANCE_PURGE_TARGETS } from '../../shared/maintenance'
import { useMediaStorage } from '../utils/media-storage'

const REVISION_TYPES_BY_TARGET: Record<Exclude<MaintenancePurgeTarget, 'media'>, string[] | null> = {
  articles: ['articles'],
  recipes: ['recipes'],
  pages: ['pages'],
  'category-articles': ['category-articles'],
  categories: ['categories'],
  'legacy-media-map': null,
}

async function countTable(db: AppDb, table: SQLiteTable) {
  const row = await db.select({ value: count() }).from(table).get()
  return Number(row?.value ?? 0)
}

export async function getMaintenanceCounts(db: AppDb): Promise<MaintenanceCounts> {
  const legacyMedia = await db
    .select({ value: count() })
    .from(schema.legacyStrapiMap)
    .where(eq(schema.legacyStrapiMap.sourceType, 'media'))
    .get()

  return {
    articles: await countTable(db, schema.articles),
    recipes: await countTable(db, schema.recipes),
    pages: await countTable(db, schema.pages),
    categoryArticles: await countTable(db, schema.categoryArticles),
    categories: await countTable(db, schema.categories),
    legacyMediaMap: Number(legacyMedia?.value ?? 0),
    media: await countTable(db, schema.blobs),
  }
}

async function deleteRevisionsForTypes(db: AppDb, contentTypes: string[]) {
  if (!contentTypes.length) return
  await db
    .delete(schema.contentRevisions)
    .where(inArray(schema.contentRevisions.contentType, contentTypes))
}

async function purgeArticles(db: AppDb): Promise<number> {
  const n = await countTable(db, schema.articles)
  if (n === 0) return 0

  await db.delete(schema.seo).where(isNotNull(schema.seo.articleId))
  await deleteRevisionsForTypes(db, REVISION_TYPES_BY_TARGET.articles!)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'articles'))
  await db.delete(schema.articles)
  return n
}

async function purgeRecipes(db: AppDb): Promise<number> {
  const n = await countTable(db, schema.recipes)
  if (n === 0) return 0

  await db.delete(schema.ingredients)
  await db.delete(schema.recipeUtensils)
  await db.delete(schema.nutrition)
  await db.delete(schema.reviews)
  await db.delete(schema.seo).where(isNotNull(schema.seo.recipeId))
  await deleteRevisionsForTypes(db, REVISION_TYPES_BY_TARGET.recipes!)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'recipes'))
  await db.delete(schema.recipes)
  return n
}

async function purgePages(db: AppDb): Promise<number> {
  const n = await countTable(db, schema.pages)
  if (n === 0) return 0

  await db.delete(schema.seo).where(isNotNull(schema.seo.pageId))
  await deleteRevisionsForTypes(db, REVISION_TYPES_BY_TARGET.pages!)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'pages'))
  await db.update(schema.pages).set({ parentId: null })
  await db.delete(schema.pages)
  return n
}

async function purgeCategoryArticles(db: AppDb): Promise<number> {
  const n = await countTable(db, schema.categoryArticles)
  if (n === 0) return 0

  await db.update(schema.articles).set({ categoryId: null })
  await deleteRevisionsForTypes(db, REVISION_TYPES_BY_TARGET['category-articles']!)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'category-articles'))
  await db.delete(schema.categoryArticles)
  return n
}

async function purgeCategories(db: AppDb): Promise<number> {
  const n = await countTable(db, schema.categories)
  if (n === 0) return 0

  await db.update(schema.recipes).set({ categoryId: null })
  await db.delete(schema.categoryBlobs)
  await deleteRevisionsForTypes(db, REVISION_TYPES_BY_TARGET.categories!)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'categories'))
  await db.delete(schema.categories)
  return n
}

async function purgeLegacyMediaMap(db: AppDb): Promise<number> {
  const row = await db
    .select({ value: count() })
    .from(schema.legacyStrapiMap)
    .where(eq(schema.legacyStrapiMap.sourceType, 'media'))
    .get()
  const n = Number(row?.value ?? 0)
  if (n === 0) return 0

  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'media'))
  return n
}

/** Removes gallery catalog, Strapi media map, and detaches blob FKs (files deleted after commit). */
async function purgeMediaCatalog(db: AppDb): Promise<{ count: number, pathnames: string[] }> {
  const rows = await db.select({ pathname: schema.blobs.pathname }).from(schema.blobs).all()
  const pathnames = rows.map(row => row.pathname)

  await db.update(schema.articles).set({ coverBlobPathname: null })
  await db.update(schema.recipes).set({ coverBlobPathname: null })
  await db.update(schema.socialMeta).set({ imageBlobPathname: null })
  await db.delete(schema.categoryBlobs)
  await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'media'))
  await db.delete(schema.blobs)

  return { count: pathnames.length, pathnames }
}

const PURGE_HANDLERS: Record<Exclude<MaintenancePurgeTarget, 'media'>, (db: AppDb) => Promise<number>> = {
  articles: purgeArticles,
  recipes: purgeRecipes,
  pages: purgePages,
  'category-articles': purgeCategoryArticles,
  categories: purgeCategories,
  'legacy-media-map': purgeLegacyMediaMap,
}

/** Safe order when purging multiple targets (children before parents). */
const PURGE_ORDER = MAINTENANCE_PURGE_TARGETS

export async function runMaintenancePurge(
  db: AppDb,
  targets: MaintenancePurgeTarget[],
  event?: H3Event,
): Promise<MaintenancePurgeResult> {
  const unique = [...new Set(targets)]
  const ordered = PURGE_ORDER.filter(t => unique.includes(t))
  const deleted: MaintenancePurgeResult['deleted'] = {}
  let mediaPathnames: string[] = []

  await db.transaction(async (tx) => {
    for (const target of ordered) {
      if (target === 'media') {
        const result = await purgeMediaCatalog(tx as AppDb)
        deleted.media = result.count
        mediaPathnames = result.pathnames
        continue
      }
      deleted[target] = await PURGE_HANDLERS[target](tx as AppDb)
    }
  })

  if (mediaPathnames.length && event) {
    const storage = useMediaStorage(event)
    for (const pathname of mediaPathnames) {
      try {
        await storage.del(pathname)
      }
      catch {
        // Object may already be missing from R2/local disk
      }
    }
  }

  return { deleted }
}

export async function countRowsForTargets(
  db: AppDb,
  targets: MaintenancePurgeTarget[],
): Promise<number> {
  const counts = await getMaintenanceCounts(db)
  const map: Record<MaintenancePurgeTarget, number> = {
    articles: counts.articles,
    recipes: counts.recipes,
    pages: counts.pages,
    'category-articles': counts.categoryArticles,
    categories: counts.categories,
    'legacy-media-map': counts.legacyMediaMap,
    media: counts.media,
  }
  return targets.reduce((sum, t) => sum + (map[t] ?? 0), 0)
}
