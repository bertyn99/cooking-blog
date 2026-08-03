import { pagePublicPath, type NestedPageParent } from './public-site-paths'

export interface PageHierarchyNode extends NestedPageParent {
  title?: string | null
  name?: string
}

export interface PageTreeSource {
  id: number
  slug: string
  title?: string | null
  name: string
  parentId?: number | null
  parent?: PageHierarchyNode | null
}

export interface PageTreeRow<T extends PageTreeSource = PageTreeSource> extends T {
  depth: number
  publicPath: string
  filiation: string
  ancestorLabels: string[]
}

export function pageHierarchyLabel(
  node: Pick<PageHierarchyNode, 'title' | 'name' | 'slug'>,
): string {
  const title = node.title?.trim()
  if (title) {
    return title
  }
  const name = node.name?.trim()
  if (name) {
    return name
  }
  return node.slug
}

export function pageAncestorLabels(parent?: PageHierarchyNode | null): string[] {
  const labels: string[] = []
  let current: PageHierarchyNode | null | undefined = parent
  while (current) {
    labels.unshift(pageHierarchyLabel(current))
    current = current.parent ?? null
  }
  return labels
}

/** Human-readable ancestor chain (excludes the page itself). */
export function pageFiliationLabel(
  parent: PageHierarchyNode | null | undefined,
  rootLabel = 'Page racine',
): string {
  const ancestors = pageAncestorLabels(parent)
  return ancestors.length > 0 ? ancestors.join(' / ') : rootLabel
}

/**
 * Builds nested parent chain from `parentId` + flat list (full path even when API
 * only shallow-populates `parent`).
 */
export function parentChainFromIds<T extends PageTreeSource>(
  page: T,
  byId: Map<number, T>,
  maxHops = 64,
): PageHierarchyNode | null {
  if (page.parentId == null) {
    return null
  }

  const nodes: PageHierarchyNode[] = []
  const visited = new Set<number>()
  let currentId: number | null = page.parentId

  for (let hop = 0; currentId != null && hop < maxHops; hop++) {
    if (visited.has(currentId)) {
      break
    }
    visited.add(currentId)
    const ancestor = byId.get(currentId)
    if (!ancestor) {
      break
    }
    nodes.unshift({
      slug: ancestor.slug,
      title: ancestor.title ?? null,
      name: ancestor.name,
      parent: null,
    })
    currentId = ancestor.parentId ?? null
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i]!.parent = i > 0 ? nodes[i - 1]! : null
  }

  return nodes.length > 0 ? nodes[nodes.length - 1]! : null
}

export function resolvePagePublicPath<T extends PageTreeSource>(
  page: T,
  byId: Map<number, T>,
): string {
  return pagePublicPath(page.slug, parentChainFromIds(page, byId))
}

export function orderPagesAsTree<T extends PageTreeSource>(pages: T[]): PageTreeRow<T>[] {
  const byId = new Map(pages.map(page => [page.id, page]))
  const childrenByParent = new Map<number | 'root', T[]>()

  for (const page of pages) {
    const parentKey =
      page.parentId != null && byId.has(page.parentId) ? page.parentId : 'root'
    const bucket = childrenByParent.get(parentKey) ?? []
    bucket.push(page)
    childrenByParent.set(parentKey, bucket)
  }

  const sortSiblings = (a: T, b: T) =>
    pageHierarchyLabel(a).localeCompare(pageHierarchyLabel(b), 'fr', { sensitivity: 'base' })

  const ordered: PageTreeRow<T>[] = []

  const walk = (parentKey: number | 'root', depth: number) => {
    const siblings = [...(childrenByParent.get(parentKey) ?? [])].sort(sortSiblings)
    for (const page of siblings) {
      const parentChain = parentChainFromIds(page, byId)
      const ancestorLabels = pageAncestorLabels(parentChain)
      ordered.push({
        ...page,
        depth,
        publicPath: resolvePagePublicPath(page, byId),
        filiation: pageFiliationLabel(parentChain),
        ancestorLabels,
      })
      walk(page.id, depth + 1)
    }
  }

  walk('root', 0)

  const placed = new Set(ordered.map(row => row.id))
  const orphans = pages
    .filter(page => !placed.has(page.id))
    .sort(sortSiblings)

  for (const page of orphans) {
    const parentChain = parentChainFromIds(page, byId)
    const ancestorLabels = pageAncestorLabels(parentChain)
    ordered.push({
      ...page,
      depth: 0,
      publicPath: resolvePagePublicPath(page, byId),
      filiation: pageFiliationLabel(parentChain),
      ancestorLabels,
    })
  }

  return ordered
}
