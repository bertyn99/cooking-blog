import { describe, expect, it } from 'vitest'
import { parsePagination, paginateResult } from '../../server/utils/pagination'

describe('parsePagination', () => {
  it('handles missing params with defaults', () => {
    const result = parsePagination({})
    expect(result).toEqual({ offset: 0, limit: 10, page: 1, pageSize: 10 })
  })

  it('parses valid page and pageSize', () => {
    const result = parsePagination({ page: '3', pageSize: '20' })
    expect(result).toEqual({ offset: 40, limit: 20, page: 3, pageSize: 20 })
  })

  it('caps pageSize at 100', () => {
    const result = parsePagination({ pageSize: '999' })
    expect(result.limit).toBe(100)
    expect(result.pageSize).toBe(100)
  })

  it('ensures minimum page is 1', () => {
    const result = parsePagination({ page: '0' })
    expect(result.page).toBe(1)
    expect(result.offset).toBe(0)
  })

  it('handles negative page numbers', () => {
    const result = parsePagination({ page: '-5' })
    expect(result.page).toBe(1)
    expect(result.offset).toBe(0)
  })

  it('handles non-numeric inputs gracefully', () => {
    const result = parsePagination({ page: 'abc', pageSize: 'xyz' })
    expect(result).toEqual({ offset: 0, limit: 10, page: 1, pageSize: 10 })
  })

  it('calculates offset correctly', () => {
    const result = parsePagination({ page: '5', pageSize: '15' })
    expect(result.offset).toBe(60) // (5-1) * 15
    expect(result.limit).toBe(15)
    expect(result.page).toBe(5)
    expect(result.pageSize).toBe(15)
  })
})

describe('paginateResult', () => {
  it('returns correct meta shape with pagination', () => {
    const data = [{ id: 1 }, { id: 2 }]
    const result = paginateResult(data, 25, 1, 10)
    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 3, total: 25 },
      },
    })
  })

  it('calculates pageCount correctly when total is exact multiple', () => {
    const result = paginateResult([], 20, 1, 10)
    expect(result.meta.pagination.pageCount).toBe(2)
  })

  it('calculates pageCount correctly for remainder', () => {
    const result = paginateResult([], 21, 1, 10)
    expect(result.meta.pagination.pageCount).toBe(3)
  })

  it('handles empty data', () => {
    const result = paginateResult([], 0, 1, 10)
    expect(result.meta.pagination.pageCount).toBe(0)
    expect(result.meta.pagination.total).toBe(0)
    expect(result.data).toEqual([])
  })
})
