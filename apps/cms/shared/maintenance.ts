export const MAINTENANCE_PURGE_TARGETS = [
  'articles',
  'recipes',
  'pages',
  'category-articles',
  'categories',
  'legacy-media-map',
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
  legacyMediaMap: number
  media: number
}

export interface MaintenancePurgeResult {
  deleted: Partial<Record<MaintenancePurgeTarget, number>>
}
