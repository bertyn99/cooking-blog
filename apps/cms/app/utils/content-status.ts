import type { ContentStatus } from '~/types/cms'

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  scheduled: 'Planifié',
}

export function contentStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as ContentStatus]
  }
  return status
}

export function contentStatusBadgeColor(status: string): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'published':
      return 'success'
    case 'scheduled':
      return 'warning'
    default:
      return 'neutral'
  }
}
