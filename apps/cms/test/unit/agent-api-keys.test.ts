import { describe, expect, it } from 'vitest'
import {
  AGENT_SCOPES,
  API_KEY_SCOPES,
  TRANSFER_SCOPES,
  apiKeyHasContentWriteScope,
  apiKeyHasWriteScope,
  normalizeApiKeyScopes,
  normalizeTransferScopes,
} from '../../shared/api-keys'

describe('api key scopes (agent MCP)', () => {
  it('includes transfer and agent scopes in API_KEY_SCOPES', () => {
    expect(TRANSFER_SCOPES).toEqual(['articles', 'recipes', 'media'])
    expect(AGENT_SCOPES).toEqual(['pages', 'write'])
    expect(API_KEY_SCOPES).toContain('write')
    expect(API_KEY_SCOPES).toContain('pages')
  })

  it('normalizes agent scopes', () => {
    expect(normalizeApiKeyScopes(['write', 'pages', 'articles', 'nope']))
      .toEqual(['articles', 'pages', 'write'])
  })

  it('normalizeTransferScopes excludes agent scopes', () => {
    expect(normalizeTransferScopes(['write', 'pages', 'media', 'articles']))
      .toEqual(['articles', 'media'])
  })

  it('write scope checks', () => {
    expect(apiKeyHasWriteScope(['articles', 'write'])).toBe(true)
    expect(apiKeyHasWriteScope(['articles'])).toBe(false)
    expect(apiKeyHasContentWriteScope(['write', 'recipes'], 'recipes')).toBe(true)
    expect(apiKeyHasContentWriteScope(['write', 'articles'], 'recipes')).toBe(false)
  })
})
