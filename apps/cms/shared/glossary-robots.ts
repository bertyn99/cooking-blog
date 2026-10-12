/** Stub / unpublished glossary fiches. */
export const GLOSSARY_NOINDEX_ROBOTS = 'noindex,follow'

/** Set on human publish so the fiche can enter the sitemap. */
export const GLOSSARY_INDEX_ROBOTS = 'index, follow'

export function isNoindexRobots(value?: string | null): boolean {
  return Boolean(value && /\bnoindex\b/i.test(value))
}

export function glossaryRobotsForStatus(status: 'draft' | 'published'): string {
  return status === 'published' ? GLOSSARY_INDEX_ROBOTS : GLOSSARY_NOINDEX_ROBOTS
}
