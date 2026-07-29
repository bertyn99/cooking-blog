import { describe, expect, it } from 'vitest'
import { slugifyString, generateUniqueSlug } from '../../server/utils/slug'

describe('slugifyString', () => {
  it('handles French accents: é -> e', () => {
    expect(slugifyString('émietté')).toBe('emiette')
  })

  it('handles French accents: à -> a', () => {
    expect(slugifyString('à la carte')).toBe('a-la-carte')
  })

  it('handles French accents: ç -> c', () => {
    expect(slugifyString('reçu garçon')).toBe('recu-garcon')
  })

  it('handles combined French accents', () => {
    expect(slugifyString('Crème brûlée')).toBe('creme-brulee')
  })

  it('lowercases and hyphenates', () => {
    expect(slugifyString('Recette De Cuisine')).toBe('recette-de-cuisine')
  })

  it('strips special characters', () => {
    expect(slugifyString('Hello & World! @test')).toBe('hello-world-test')
  })

  it('replaces underscores with hyphens', () => {
    expect(slugifyString('hello_world_test')).toBe('hello-world-test')
  })

  it('handles empty string', () => {
    expect(slugifyString('')).toBe('')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugifyString('--hello--')).toBe('hello')
  })

  it('collapses multiple spaces and hyphens', () => {
    expect(slugifyString('hello   world---test')).toBe('hello-world-test')
  })

  it('handles strings with only special chars', () => {
    expect(slugifyString('@#$%^&*')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('returns base slug when no collisions', () => {
    expect(generateUniqueSlug('Test Recipe', [])).toBe('test-recipe')
  })

  it('appends -2 on first collision', () => {
    expect(generateUniqueSlug('test', ['test'])).toBe('test-2')
  })

  it('increments suffix on multiple collisions', () => {
    expect(generateUniqueSlug('test', ['test', 'test-2'])).toBe('test-3')
  })

  it('handles empty text by using untitled', () => {
    expect(generateUniqueSlug('@#$%', [])).toBe('untitled')
  })

  it('increments untitled on collision', () => {
    expect(generateUniqueSlug('@#$%', ['untitled'])).toBe('untitled-2')
  })

  it('handles multiple collisions with gaps in sequence', () => {
    expect(generateUniqueSlug('test', ['test', 'test-2', 'test-4'])).toBe('test-3')
  })
})
