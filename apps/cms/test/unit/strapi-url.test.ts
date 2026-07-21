import { describe, expect, it } from 'vitest'
import { normalizeStrapiApiBase, strapiUploadOrigins } from '../../shared/strapi-url'

describe('normalizeStrapiApiBase', () => {
  it('strips trailing /api', () => {
    expect(normalizeStrapiApiBase('https://admin.example.com/api/')).toBe('https://admin.example.com')
  })
})

describe('strapiUploadOrigins', () => {
  it('deduplicates configured base', () => {
    const origins = strapiUploadOrigins('https://admin.journalducuistot.fr/api')
    expect(origins[0]).toBe('https://admin.journalducuistot.fr')
  })
})
