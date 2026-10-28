import { describe, expect, it } from 'vitest'
import { createRecipeSchema, updateRecipeSchema } from '../../server/utils/validations/recipes'
import { recipeOriginCuisineLabels, recipeOriginCuisineText } from '../../shared/recipe-origin'

describe('recipe origin field', () => {
  const parseOrigin = (value: unknown) =>
    updateRecipeSchema.shape.origin.parse(value)

  it('derives continent from a known country', () => {
    const origins = parseOrigin([{ country: 'Japonaise' }])
    expect(origins).toEqual([{ country: 'japonaise', continent: 'asie' }])
  })

  it('lowercases and trims custom countries', () => {
    const origins = parseOrigin([
      { country: '  Bretonne ', continent: 'europe' },
    ])
    expect(origins).toEqual([{ country: 'bretonne', continent: 'europe' }])
  })

  it('rejects an unknown country without a continent', () => {
    expect(() => parseOrigin([{ country: 'atlante' }])).toThrow()
  })

  it('rejects an unknown continent', () => {
    expect(() => parseOrigin([{ country: 'italienne', continent: 'planète-bleue' }])).toThrow()
  })

  it('renders one recipeCuisine value for a multi-origin recipe (curry japonais)', () => {
    const origins = parseOrigin([
      { country: 'indienne' },
      { country: 'japonaise' },
    ])
    expect(recipeOriginCuisineText(origins)).toBe('Indienne, Japonaise')
  })

  it('accepts multiple origins for one recipe (curry japonais)', () => {
    const origins = parseOrigin([
      { country: 'indienne' },
      { country: 'japonaise' },
    ])
    expect(origins).toHaveLength(2)
    expect(recipeOriginCuisineLabels(origins)).toEqual(['Indienne', 'Japonaise'])
  })

  it('deduplicates by country', () => {
    const origins = parseOrigin([
      { country: 'italienne' },
      { country: 'Italienne' },
    ])
    expect(origins).toEqual([{ country: 'italienne', continent: 'europe' }])
  })

  it('caps at 4 origins', () => {
    expect(() => parseOrigin([
      { country: 'italienne' },
      { country: 'francaise' },
      { country: 'espagnole' },
      { country: 'portugaise' },
      { country: 'belge' },
    ])).toThrow()
  })

  it('is optional in both create and update schemas', () => {
    const without = createRecipeSchema.parse({ title: 'Poulet yassa' })
    expect(without.origin).toBeUndefined()
    const partial = updateRecipeSchema.parse({ time: 10 })
    expect(partial.origin).toBeUndefined()
  })
})
