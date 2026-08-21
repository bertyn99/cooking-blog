import { describe, expect, it } from 'vitest'
import {
  API_KEY_SCOPES,
  apiKeyHasScope,
  normalizeApiKeyScopes,
} from '../../shared/api-keys'
import {
  generateApiKeySecret,
  hashApiKeySecret,
  isApiKeyExpired,
  parseBearerToken,
  parseCreateApiKeyBody,
  secretsEqual,
} from '../../server/utils/api-key-crypto'
import { parseTransferPage } from '../../server/services/transfer-export'

describe('api key scopes', () => {
  it('normalizes and orders known scopes', () => {
    expect(normalizeApiKeyScopes(['media', 'articles', 'media', 'nope']))
      .toEqual(['articles', 'media'])
    expect(normalizeApiKeyScopes(['write', 'pages', 'recipes']))
      .toEqual(['recipes', 'pages', 'write'])
    expect(API_KEY_SCOPES).toContain('recipes')
    expect(API_KEY_SCOPES).toContain('write')
  })

  it('checks scope membership', () => {
    expect(apiKeyHasScope(['articles'], 'articles')).toBe(true)
    expect(apiKeyHasScope(['articles'], 'media')).toBe(false)
  })
})

describe('api key crypto', () => {
  it('hashes deterministically and compares safely', () => {
    const a = hashApiKeySecret('jdc_test')
    const b = hashApiKeySecret('jdc_test')
    expect(a).toBe(b)
    expect(secretsEqual(a, b)).toBe(true)
    expect(secretsEqual(a, hashApiKeySecret('other'))).toBe(false)
  })

  it('generates jdc_ secrets with prefix', () => {
    const generated = generateApiKeySecret()
    expect(generated.secret.startsWith('jdc_')).toBe(true)
    expect(generated.keyPrefix).toBe(generated.secret.slice(0, 12))
    expect(generated.keyHash).toBe(hashApiKeySecret(generated.secret))
  })

  it('parses bearer tokens', () => {
    expect(parseBearerToken('Bearer abc')).toBe('abc')
    expect(parseBearerToken('bearer  xyz ')).toBe('xyz')
    expect(parseBearerToken(undefined)).toBeNull()
  })

  it('parses create body', () => {
    expect(parseCreateApiKeyBody({
      name: ' clone ',
      scopes: ['recipes', 'articles'],
    })).toEqual({
      name: 'clone',
      scopes: ['articles', 'recipes'],
      expiresAt: null,
    })
  })

  it('detects expiry', () => {
    expect(isApiKeyExpired(null)).toBe(false)
    expect(isApiKeyExpired('2099-01-01T00:00:00.000Z')).toBe(false)
    expect(isApiKeyExpired('2000-01-01T00:00:00.000Z')).toBe(true)
  })
})

describe('parseTransferPage', () => {
  it('clamps limit and parses cursor', () => {
    expect(parseTransferPage({ limit: '10', cursor: '5' })).toEqual({
      limit: 10,
      cursor: 5,
    })
    expect(parseTransferPage({ limit: '9999' }).limit).toBe(200)
  })
})
