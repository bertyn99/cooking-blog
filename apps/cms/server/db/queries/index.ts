import type { AppDb } from '../create-db'
import { createArticleQueries } from './articles'
import { createRecipeQueries } from './recipes'
import { createPageQueries } from './pages'
import { createCategoryQueries } from './categories'
import { createCategoryArticleQueries } from './category-articles'
import { createUserQueries } from './users'
import { createSeoQueries } from './seo'
import { createPublishingQueries } from './publishing'
import { createCalendarQueries } from './calendar'
import { createDashboardQueries } from './dashboard'
import { createMaintenanceQueries } from './maintenance'
import { createBlobQueries } from './blobs'
import { createLegacyStrapiMapQueries } from './legacy-strapi-map'
import { createTagQueries } from './tags'
import { createRedirectQueries } from './redirects'
import { createMediaFolderQueries } from './media-folders'
import { createSiteSettingsQueries } from './site-settings'
import { createNavigationQueries } from './navigation'
import { createContentGenerationQueries } from './content-generation'
import { createApiKeyQueries } from './api-keys'

/**
 * Single entry point for all Drizzle access in the CMS server.
 * Handlers and services should use `useQueries(event)` instead of `useDb` + raw SQL.
 */
export function createDbQueries(db: AppDb) {
  return {
    articles: createArticleQueries(db),
    recipes: createRecipeQueries(db),
    pages: createPageQueries(db),
    categories: createCategoryQueries(db),
    categoryArticles: createCategoryArticleQueries(db),
    users: createUserQueries(db),
    seo: createSeoQueries(db),
    publishing: createPublishingQueries(db),
    calendar: createCalendarQueries(db),
    dashboard: createDashboardQueries(db),
    maintenance: createMaintenanceQueries(db),
    blobs: createBlobQueries(db),
    legacyStrapiMap: createLegacyStrapiMapQueries(db),
    tags: createTagQueries(db),
    redirects: createRedirectQueries(db),
    mediaFolders: createMediaFolderQueries(db),
    siteSettings: createSiteSettingsQueries(db),
    navigation: createNavigationQueries(db),
    contentGeneration: createContentGenerationQueries(db),
    apiKeys: createApiKeyQueries(db),
  }
}

export type DbQueries = ReturnType<typeof createDbQueries>
