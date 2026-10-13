import { describe, expect, it } from 'vitest'
import {
  bulkContentSchema,
  bulkPagesSchema,
} from '../../server/utils/validations/content-bulk'
import { chunkIds } from '../../server/db/queries/_shared/id-chunks'
import {
  bulkDeleteDescription,
  bulkSuccessTitle,
  excludeHomeRows,
  filterSelectionMoveRoots,
  partitionBulkIds,
} from '../../shared/content-bulk'

describe('content bulk schema', () => {
  it('accepts delete, publish and unpublish with ids', () => {
    expect(bulkContentSchema.parse({ ids: [1, 2], action: 'delete' }).action).toBe('delete')
    expect(bulkContentSchema.parse({ ids: [3], action: 'publish' }).ids).toEqual([3])
    expect(bulkContentSchema.parse({ ids: [4, 5], action: 'unpublish' }).action).toBe('unpublish')
  })

  it('rejects empty ids, too many ids, and unknown actions', () => {
    expect(() => bulkContentSchema.parse({ ids: [], action: 'delete' })).toThrow()
    expect(() => bulkContentSchema.parse({
      ids: Array.from({ length: 151 }, (_, index) => index + 1),
      action: 'delete',
    })).toThrow()
    expect(() => bulkContentSchema.parse({ ids: [1], action: 'archive' })).toThrow()
  })
})

describe('pages bulk schema', () => {
  it('reuses content actions and accepts a parent move', () => {
    expect(bulkPagesSchema.parse({ ids: [1], action: 'delete' }).action).toBe('delete')
    expect(bulkPagesSchema.parse({ ids: [2, 3], action: 'move', parentId: 9 }).parentId).toBe(9)
    expect(bulkPagesSchema.parse({ ids: [2], action: 'move', parentId: null }).parentId).toBeNull()
    expect(bulkPagesSchema.parse({
      ids: [4, 5],
      action: 'move',
      newParentName: 'Dossiers',
    }).newParentName).toBe('Dossiers')
  })

  it('requires exactly one of parentId or newParentName for move', () => {
    expect(() => bulkPagesSchema.parse({ ids: [1], action: 'move' })).toThrow()
    expect(() => bulkPagesSchema.parse({
      ids: [1],
      action: 'move',
      parentId: 2,
      newParentName: 'Autre',
    })).toThrow()
  })

  it('rejects parent fields on non-move actions', () => {
    expect(() => bulkPagesSchema.parse({
      ids: [1],
      action: 'delete',
      parentId: null,
    })).toThrow()
  })
})

describe('id chunks', () => {
  it('splits ids under the D1 IN() budget', () => {
    const ids = Array.from({ length: 85 }, (_, index) => index + 1)
    expect(chunkIds(ids).map(chunk => chunk.length)).toEqual([40, 40, 5])
  })
})

describe('partitionBulkIds', () => {
  it('separates found ids from missing ids', () => {
    expect(partitionBulkIds([1, 2, 3, 4], [4, 1])).toEqual({
      foundIds: [4, 1],
      missingIds: [2, 3],
    })
  })
})

describe('excludeHomeRows', () => {
  it('keeps non-home rows and lists skipped home ids', () => {
    expect(excludeHomeRows([
      { id: 1, isHome: true },
      { id: 2, isHome: false },
      { id: 3 },
    ])).toEqual({
      skippedHomeIds: [1],
      workRows: [{ id: 2, isHome: false }, { id: 3 }],
      workIds: [2, 3],
    })
  })
})

describe('filterSelectionMoveRoots', () => {
  it('keeps the ancestor and skips nested selected descendants', () => {
    const parentIdById = new Map<number, number | null>([
      [1, null],
      [2, 1],
      [3, 2],
      [4, null],
    ])
    expect(filterSelectionMoveRoots([1, 2, 3, 4], parentIdById)).toEqual([1, 4])
  })

  it('keeps siblings when their parent is not selected', () => {
    const parentIdById = new Map<number, number | null>([
      [1, null],
      [2, 1],
      [3, 1],
    ])
    expect(filterSelectionMoveRoots([2, 3], parentIdById)).toEqual([2, 3])
  })
})

describe('bulk copy', () => {
  it('builds feminine delete copy and move success titles', () => {
    expect(bulkDeleteDescription({ singular: 'page', plural: 'pages', feminine: true }, 1))
      .toBe('Cette page sera masquée. Cette action est une suppression douce.')
    expect(bulkSuccessTitle({ singular: 'page', plural: 'pages', feminine: true }, 'move', 2))
      .toBe('2 pages déplacées')
  })
})
