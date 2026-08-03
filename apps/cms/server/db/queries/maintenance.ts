import { count, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { AppDb } from '../create-db'
import { schema } from '../create-db'
import type {
  MaintenanceCounts,
  MaintenancePurgeResult,
  MaintenancePurgeTarget,
} from '../../../shared/maintenance'
import { MAINTENANCE_PURGE_TARGETS } from '../../../shared/maintenance'

const REVISION_TYPES_BY_TARGET: Record<Exclude<MaintenancePurgeTarget, 'media' | 'legacy-strapi-map'>, string[] | null> = {
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

export function createMaintenanceQueries(db: AppDb) {
  async function getCounts(): Promise<MaintenanceCounts> {
    const legacyMedia = await db
      .select({ value: count() })
      .from(schema.legacyStrapiMap)
      .where(eq(schema.legacyStrapiMap.sourceType, 'media'))
      .get()

    const legacyAll = await db
      .select({ value: count() })
      .from(schema.legacyStrapiMap)
      .get()

    return {
      articles: await countActive(db, schema.articles),
      recipes: await countActive(db, schema.recipes),
      pages: await countActive(db, schema.pages),
      categoryArticles: await countActive(db, schema.categoryArticles),
      categories: await countActive(db, schema.categories),
      legacyMediaMap: Number(legacyMedia?.value ?? 0),
      legacyStrapiMap: Number(legacyAll?.value ?? 0),
      media: await countTable(db, schema.blobs),
    }
  }

  async function countActive(
    conn: AppDb,
    table: typeof schema.articles,
  ) {
    const row = await conn
      .select({ value: count() })
      .from(table)
      .where(isNull(table.deletedAt))
      .get()
    return Number(row?.value ?? 0)
  }

  async function deleteRevisionsForTypes(contentTypes: string[]) {
    if (!contentTypes.length) return
    await db
      .delete(schema.contentRevisions)
      .where(inArray(schema.contentRevisions.contentType, contentTypes))
  }

  async function purgeArticles(): Promise<number> {
    const n = await countTable(db, schema.articles)
    if (n === 0) return 0

    await db.delete(schema.seo).where(isNotNull(schema.seo.articleId))
    await deleteRevisionsForTypes(REVISION_TYPES_BY_TARGET.articles!)
    await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'articles'))
    await db.delete(schema.articles)
    return n
  }

  async function purgeRecipes(): Promise<number> {
    const n = await countTable(db, schema.recipes)
    if (n === 0) return 0

    await db.delete(schema.ingredients)
    await db.delete(schema.recipeUtensils)
    await db.delete(schema.nutrition)
    await db.delete(schema.reviews)
    await db.delete(schema.seo).where(isNotNull(schema.seo.recipeId))
    await deleteRevisionsForTypes(REVISION_TYPES_BY_TARGET.recipes!)
    await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'recipes'))
    await db.delete(schema.recipes)
    return n
  }

  async function purgePages(): Promise<number> {
    const n = await countTable(db, schema.pages)
    if (n === 0) return 0

    await db.delete(schema.seo).where(isNotNull(schema.seo.pageId))
    await deleteRevisionsForTypes(REVISION_TYPES_BY_TARGET.pages!)
    await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'pages'))
    await db.update(schema.pages).set({ parentId: null })
    await db.delete(schema.pages)
    return n
  }

  async function purgeCategoryArticles(): Promise<number> {
    const n = await countTable(db, schema.categoryArticles)
    if (n === 0) return 0

    await db.update(schema.articles).set({ categoryId: null })
    await deleteRevisionsForTypes(REVISION_TYPES_BY_TARGET['category-articles']!)
    await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'category-articles'))
    await db.delete(schema.categoryArticles)
    return n
  }

  async function purgeCategories(): Promise<number> {
    const n = await countTable(db, schema.categories)
    if (n === 0) return 0

    await db.update(schema.recipes).set({ categoryId: null })
    await db.delete(schema.categoryBlobs)
    await deleteRevisionsForTypes(REVISION_TYPES_BY_TARGET.categories!)
    await db.delete(schema.legacyStrapiMap).where(eq(schema.legacyStrapiMap.sourceType, 'categories'))
    await db.delete(schema.categories)
    return n
  }

  async function purgeLegacyMediaMap(): Promise<number> {
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

  async function purgeMediaCatalog(): Promise<{ count: number, pathnames: string[] }> {
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

  async function purgeLegacyStrapiMapAll(): Promise<number> {
    const n = await countTable(db, schema.legacyStrapiMap)
    if (n === 0) return 0
    await db.delete(schema.legacyStrapiMap)
    return n
  }

  const PURGE_HANDLERS: Record<Exclude<MaintenancePurgeTarget, 'media'>, () => Promise<number>> = {
    articles: purgeArticles,
    recipes: purgeRecipes,
    pages: purgePages,
    'category-articles': purgeCategoryArticles,
    categories: purgeCategories,
    'legacy-media-map': purgeLegacyMediaMap,
    'legacy-strapi-map': purgeLegacyStrapiMapAll,
  }

  return {
    getCounts,

    async purgeTargets(targets: MaintenancePurgeTarget[]): Promise<{
      deleted: MaintenancePurgeResult['deleted']
      mediaPathnames: string[]
    }> {
      const unique = [...new Set(targets)]
      const ordered = MAINTENANCE_PURGE_TARGETS.filter(t => unique.includes(t))
      const deleted: MaintenancePurgeResult['deleted'] = {}
      let mediaPathnames: string[] = []

      await db.transaction(async (tx) => {
        const run = createMaintenanceQueries(tx as AppDb)
        for (const target of ordered) {
          if (target === 'media') {
            const result = await run.purgeMediaCatalog()
            deleted.media = result.count
            mediaPathnames = result.pathnames
            continue
          }
          deleted[target] = await run.purgeOne(target)
        }
      })

      return { deleted, mediaPathnames }
    },

    async purgeOne(target: Exclude<MaintenancePurgeTarget, 'media'>) {
      return PURGE_HANDLERS[target]()
    },

    purgeMediaCatalog,

    async countRowsForTargets(targets: MaintenancePurgeTarget[]): Promise<number> {
      const counts = await getCounts()
      const map: Record<MaintenancePurgeTarget, number> = {
        articles: counts.articles,
        recipes: counts.recipes,
        pages: counts.pages,
        'category-articles': counts.categoryArticles,
        categories: counts.categories,
        'legacy-media-map': counts.legacyMediaMap,
        'legacy-strapi-map': counts.legacyStrapiMap,
        media: counts.media,
      }
      return targets.reduce((sum, t) => sum + (map[t] ?? 0), 0)
    },
  }
}
