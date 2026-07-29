import type { CalendarContentType, CalendarItem } from './calendar'

export interface DashboardPipelineRow {
  contentType: CalendarContentType
  label: string
  listPath: string
  draft: number
  scheduled: number
  published: number
}

export interface DashboardBacklogItem extends CalendarItem {
  updatedAt: string
}

export interface DashboardRecentItem {
  id: number
  contentType: CalendarContentType
  title: string
  status: CalendarItem['status']
  updatedAt: string
  editPath: string
}

export interface DashboardLastPublished {
  title: string
  publishedAt: string
  editPath: string
}

export interface DashboardHealthCounts {
  publishedMissingCover: number
  publishedMissingSeoDescription: number
  imagesMissingAlt: number
}

export interface DashboardStrapiSnapshot {
  status: string
  dryRun: boolean
  step?: string
  message?: string
}

export interface DashboardSummary {
  locale: string
  week: { from: string, to: string }
  pipeline: DashboardPipelineRow[]
  taxonomy: {
    categoryArticles: number
    recipeCategories: number
    media: number
  }
  thisWeek: CalendarItem[]
  backlog: DashboardBacklogItem[]
  recentlyUpdated: DashboardRecentItem[]
  lastPublished: Partial<Record<CalendarContentType, DashboardLastPublished | null>>
  health: DashboardHealthCounts
  strapiImport: DashboardStrapiSnapshot
}

export const DASHBOARD_CONTENT_LABELS: Record<CalendarContentType, string> = {
  articles: 'Articles',
  recipes: 'Recettes',
  pages: 'Pages',
}

export const DASHBOARD_STATUS_LABELS: Record<CalendarItem['status'], string> = {
  draft: 'Brouillon',
  scheduled: 'Programmé',
  published: 'Publié',
}
