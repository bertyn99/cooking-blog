import { describe, expect, it } from 'vitest'
import { parseCsvParam, parseOptionalBoolean } from '../../server/utils/query-params'

describe('query-params', () => {
  it('parses booleans including false', () => {
    expect(parseOptionalBoolean('true')).toBe(true)
    expect(parseOptionalBoolean('1')).toBe(true)
    expect(parseOptionalBoolean('false')).toBe(false)
    expect(parseOptionalBoolean('0')).toBe(false)
    expect(parseOptionalBoolean(undefined)).toBeUndefined()
  })

  it('parses comma lists and repeated values', () => {
    expect(parseCsvParam('a,b')).toEqual(['a', 'b'])
    expect(parseCsvParam(['a', 'b,c'])).toEqual(['a', 'b', 'c'])
    expect(parseCsvParam('')).toBeUndefined()
  })

  it('caps comma lists', () => {
    const values = Array.from({ length: 60 }, (_, i) => `s${i}`).join(',')
    expect(parseCsvParam(values)).toHaveLength(50)
    expect(parseCsvParam('a,b,c', 2)).toEqual(['a', 'b'])
  })
})
