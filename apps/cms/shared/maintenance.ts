export const MAINTENANCE_PURGE_TARGETS = [
  'articles',
  'recipes',
  'pages',
  'category-articles',
  'categories',
  'legacy-media-map',
  'legacy-strapi-map',
  'media',
] as const

export type MaintenancePurgeTarget = typeof MAINTENANCE_PURGE_TARGETS[number]

export const MAINTENANCE_PURGE_CONFIRM_PHRASE = 'SUPPRIMER'

export interface MaintenanceCounts {
  articles: number
  recipes: number
  pages: number
  categoryArticles: number
  categories: number
  /** Rows in legacy_strapi_map with sourceType=media */
  legacyMediaMap: number
  /** All rows in legacy_strapi_map (import id mapping) */
  legacyStrapiMap: number
  media: number
}

export type CmsDatabaseSource = 'local' | 'd1'

export interface MaintenanceStatusResponse {
  counts: MaintenanceCounts
  databaseSource: CmsDatabaseSource
  strapiImportStatus: 'idle' | 'running' | 'completed' | 'failed'
}

export interface MaintenancePurgeResult {
  deleted: Partial<Record<MaintenancePurgeTarget, number>>
}
