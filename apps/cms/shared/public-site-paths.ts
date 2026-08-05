export interface NestedPageParent {
  slug: string
  parent?: NestedPageParent | null
}

/**
 * Public site path for a CMS page (matches journalducuistot.fr catch-all routing).
 */
export function pagePublicPath(slug: string, parent?: NestedPageParent | null): string {
  if (!parent?.slug) {
    return `/${slug}`
  }

  const buildParentPath = (currentParent: NestedPageParent | null | undefined): string => {
    if (!currentParent?.slug) {
      return ''
    }
    const ancestorPath = buildParentPath(currentParent.parent)
    return ancestorPath ? `${ancestorPath}/${currentParent.slug}` : currentParent.slug
  }

  const parentPath = buildParentPath(parent)
  return parentPath ? `/${parentPath}/${slug}` : `/${slug}`
}

export function articlePublicPath(articleSlug: string, categorySlug?: string | null): string {
  const slug = articleSlug.trim()
  const category = categorySlug?.trim() || 'uncategorized'
  return `/blog/${category}/${slug}`
}

export function recipePublicPath(recipeSlug: string): string {
  return `/recette/${recipeSlug}`
}

export function absolutePublicUrl(siteOrigin: string, path: string): string {
  const base = siteOrigin.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href) || /^mailto:/i.test(href)
}

export function externalLinkLabel(href: string): string {
  try {
    const url = new URL(href)
    return url.hostname.replace(/^www\./, '')
  }
  catch {
    return href
  }
}
