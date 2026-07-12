import { describe, expect, it } from 'vitest'
import { parseInclude, buildWithObject } from '../../server/utils/populate'

describe('parseInclude', () => {
  it('returns empty array for missing include', () => {
    expect(parseInclude({})).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseInclude({ include: '' })).toEqual([])
  })

  it('parses single include', () => {
    expect(parseInclude({ include: 'cover' })).toEqual(['cover'])
  })

  it('parses comma-separated includes', () => {
    expect(parseInclude({ include: 'cover,category,seo' })).toEqual(['cover', 'category', 'seo'])
  })

  it('trims whitespace around include names', () => {
    expect(parseInclude({ include: ' cover , category ' })).toEqual(['cover', 'category'])
  })

  it('returns wildcard for *', () => {
    expect(parseInclude({ include: '*' })).toEqual(['*'])
  })

  it('filters empty segments from trailing commas', () => {
    expect(parseInclude({ include: 'cover,' })).toEqual(['cover'])
  })
})

describe('buildWithObject', () => {
  const allowed = ['cover', 'category', 'seo', 'author']

  it('expands wildcard to all allowed relations', () => {
    const result = buildWithObject(['*'], allowed)
    expect(result).toEqual({
      cover: true,
      category: true,
      seo: true,
      author: true,
    })
  })

  it('returns only requested relations that are allowed', () => {
    const result = buildWithObject(['cover', 'category', 'unknown'], allowed)
    expect(result).toEqual({
      cover: true,
      category: true,
    })
  })

  it('filters out disallowed relations', () => {
    const result = buildWithObject(['cover', 'hacked_relation'], allowed)
    expect(result).toEqual({ cover: true })
  })

  it('returns empty object for empty include list', () => {
    const result = buildWithObject([], allowed)
    expect(result).toEqual({})
  })

  it('returns empty object when no allowed relations match', () => {
    const result = buildWithObject(['unknown'], allowed)
    expect(result).toEqual({})
  })

  it('returns correct object for single relation', () => {
    const result = buildWithObject(['seo'], allowed)
    expect(result).toEqual({ seo: true })
  })

  it('wildcard with empty allowlist returns empty object', () => {
    const result = buildWithObject(['*'], [])
    expect(result).toEqual({})
  })
})
