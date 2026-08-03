import { describe, expect, it } from 'vitest'
import {
  orderPagesAsTree,
  pageAncestorLabels,
  pageFiliationLabel,
  pageHierarchyLabel,
  resolvePagePublicPath,
} from '../../shared/page-hierarchy'

describe('page-hierarchy', () => {
  it('prefers title then name for labels', () => {
    expect(pageHierarchyLabel({ slug: 'x', title: 'Titre', name: 'Nom' })).toBe('Titre')
    expect(pageHierarchyLabel({ slug: 'x', title: '', name: 'Nom' })).toBe('Nom')
    expect(pageHierarchyLabel({ slug: 'fallback' })).toBe('fallback')
  })

  it('builds ancestor labels root to parent', () => {
    expect(
      pageAncestorLabels({
        slug: 'child',
        name: 'Enfant',
        parent: { slug: 'root', title: 'Racine' },
      }),
    ).toEqual(['Racine', 'Enfant'])
  })

  it('labels root pages', () => {
    expect(pageFiliationLabel(null)).toBe('Page racine')
  })

  it('resolves public path from parentId when nested parent is missing', () => {
    const byId = new Map([
      [1, { id: 1, slug: 'root', name: 'Root', parentId: null }],
      [2, { id: 2, slug: 'mid', name: 'Mid', parentId: 1 }],
      [3, { id: 3, slug: 'leaf', name: 'Leaf', parentId: 2, parent: { slug: 'mid' } }],
    ] as const)

    const leaf = byId.get(3)!
    expect(resolvePagePublicPath(leaf, byId as Map<number, typeof leaf>)).toBe('/root/mid/leaf')
  })

  it('orders pages depth-first with sibling sort', () => {
    const rows = orderPagesAsTree([
      {
        id: 2,
        slug: 'b',
        name: 'B',
        parentId: 1,
        parent: { slug: 'a', name: 'A' },
      },
      {
        id: 1,
        slug: 'a',
        name: 'A',
        parentId: null,
        parent: null,
      },
      {
        id: 3,
        slug: 'c',
        name: 'C',
        parentId: null,
        parent: null,
      },
    ])

    expect(rows.map(row => row.id)).toEqual([1, 2, 3])
    expect(rows[1]?.depth).toBe(1)
    expect(rows[1]?.publicPath).toBe('/a/b')
    expect(rows[1]?.filiation).toBe('A')
  })
})
