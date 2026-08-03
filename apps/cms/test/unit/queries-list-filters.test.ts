import { describe, expect, it } from 'vitest'
import { buildPagesQueryWhere } from '../../server/db/queries/_shared/builders/pages'
import { reorderByIds } from '../../server/db/queries/_shared/list-page'
import { searchFilter } from '../../server/db/queries/_shared/filters'
import { articles } from '../../server/db/schema/articles'
import { buildArticlesListSqlWhere } from '../../server/db/queries/articles'
import type { ArticleListOptions } from '../../server/db/queries/articles'

describe('queries list filters', () => {
  it('reorderByIds preserves SQL page order', () => {
    const rows = [{ id: 3, title: 'c' }, { id: 1, title: 'a' }, { id: 2, title: 'b' }]
    expect(reorderByIds(rows, [1, 2, 3]).map(row => row.id)).toEqual([1, 2, 3])
  })

  it('searchFilter is defined when admin article search is set', () => {
    expect(searchFilter(articles, 'tarte')).toBeDefined()
    expect(searchFilter(articles, undefined)).toBeUndefined()
  })

  it('admin pages list excludes soft-deleted rows by default', () => {
    const where = buildPagesQueryWhere({
      include: [],
      isAuthenticated: true,
      includeDeleted: false,
    })
    expect(where).toEqual({ deletedAt: { isNull: true } })
  })

  it('article list SQL where differs when search filter is set', () => {
    const base: ArticleListOptions = {
      include: [],
      isAuthenticated: true,
      includeDeleted: false,
      pagination: { offset: 0, limit: 10, page: 1, pageSize: 10 },
    }
    const withSearch = buildArticlesListSqlWhere({ ...base, filters: { search: 'tarte' } })
    const withoutSearch = buildArticlesListSqlWhere(base)
    expect(withSearch).toBeDefined()
    expect(withoutSearch).toBeDefined()
    expect(withSearch).not.toEqual(withoutSearch)
  })
})
