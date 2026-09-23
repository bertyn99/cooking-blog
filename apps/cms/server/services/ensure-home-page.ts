import { eq, and, isNull } from 'drizzle-orm'
import type { AppDb } from '../db/create-db'
import { pages } from '../db/schema/pages'
import { siteSettings } from '../db/schema/site-settings'
import { EDITOR_PAGE_DEFAULT_VIEW_KEY } from '../../shared/site-settings-keys'
import { createPageQueries } from '../db/queries/pages'
import { isPageSlugUniqueConstraint } from '../utils/sqlite-constraint'

const HOME_MARKDOWN = `::hero{image="/img/hero.jpg"}
::

::newsletter
::

::recipe-list{source="latest" limit="4"}
::

::article-list{source="latest" limit="5"}
::`

export async function ensureEditorDefaults(db: AppDb) {
  const existing = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(eq(siteSettings.key, EDITOR_PAGE_DEFAULT_VIEW_KEY))
    .get()

  if (existing) {
    return
  }

  await db.insert(siteSettings).values({
    key: EDITOR_PAGE_DEFAULT_VIEW_KEY,
    value: 'editor',
    updatedAt: new Date().toISOString(),
  })
}

async function findFrHomeId(db: AppDb) {
  const existing = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.isHome, true), isNull(pages.deletedAt), eq(pages.locale, 'fr')))
    .get()
  return existing?.id
}

export async function ensureHomePage(db: AppDb) {
  const existingHomeId = await findFrHomeId(db)
  if (existingHomeId) {
    return existingHomeId
  }

  const accueil = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.slug, 'accueil'), eq(pages.locale, 'fr'), isNull(pages.deletedAt)))
    .get()

  if (accueil) {
    const queries = createPageQueries(db)
    await queries.updateAsHome(accueil.id, 'fr', { isHome: true, parentId: null })
    return accueil.id
  }

  const now = new Date().toISOString()
  try {
    const row = await db
      .insert(pages)
      .values({
        name: 'Accueil',
        title: 'Accueil',
        slug: 'accueil',
        content: HOME_MARKDOWN,
        parentId: null,
        isHome: true,
        status: 'published',
        locale: 'fr',
        publishedAt: now,
        firstPublishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: pages.id })
      .get()

    return row?.id
  }
  catch (error) {
    const racedHome = await findFrHomeId(db)
    if (racedHome) {
      return racedHome
    }
    if (isPageSlugUniqueConstraint(error)) {
      const racedAccueil = await db
        .select({ id: pages.id })
        .from(pages)
        .where(and(eq(pages.slug, 'accueil'), eq(pages.locale, 'fr'), isNull(pages.deletedAt)))
        .get()
      if (racedAccueil) {
        const queries = createPageQueries(db)
        await queries.updateAsHome(racedAccueil.id, 'fr', { isHome: true, parentId: null })
        return racedAccueil.id
      }
    }
    throw error
  }
}
