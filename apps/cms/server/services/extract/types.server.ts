import type { StrapiEntityStats } from '../../../shared/strapi-import'

export function emptyStats(): StrapiEntityStats {
  return { created: 0, updated: 0, skipped: 0, errors: 0 }
}

export function strapiSourceId(entity: { documentId?: string, id?: number }) {
  return entity.documentId ?? String(entity.id ?? '')
}
