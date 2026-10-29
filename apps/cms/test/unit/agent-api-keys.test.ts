import { describe, expect, it } from 'vitest'
import {
  AGENT_SCOPES,
  API_KEY_SCOPES,
  TRANSFER_SCOPES,
  apiKeyHasContentWriteScope,
  apiKeyHasScheduleScope,
  apiKeyHasWriteScope,
  normalizeApiKeyScopes,
  normalizeTransferScopes,
} from '../../shared/api-keys'

describe('api key scopes (agent MCP)', () => {
  it('includes transfer and agent scopes in API_KEY_SCOPES', () => {
    expect(TRANSFER_SCOPES).toEqual(['articles', 'recipes', 'media'])
    expect(AGENT_SCOPES).toEqual(['articles', 'recipes', 'pages', 'glossary', 'write', 'schedule'])
    expect(API_KEY_SCOPES).toEqual(['articles', 'recipes', 'media', 'pages', 'glossary', 'write', 'schedule'])
    expect(API_KEY_SCOPES).toContain('write')
    expect(API_KEY_SCOPES).toContain('pages')
    expect(API_KEY_SCOPES).toContain('schedule')
  })

  it('normalizes agent scopes', () => {
    expect(normalizeApiKeyScopes(['write', 'pages', 'articles', 'glossary', 'schedule', 'nope']))
      .toEqual(['articles', 'pages', 'glossary', 'write', 'schedule'])
  })

  it('normalizeTransferScopes excludes agent scopes', () => {
    expect(normalizeTransferScopes(['write', 'pages', 'media', 'articles']))
      .toEqual(['articles', 'media'])
  })

  it('write scope checks', () => {
    expect(apiKeyHasWriteScope(['articles', 'write'])).toBe(true)
    expect(apiKeyHasWriteScope(['articles'])).toBe(false)
    expect(apiKeyHasContentWriteScope(['write', 'recipes', 'pages'], 'recipes')).toBe(true)
    expect(apiKeyHasContentWriteScope(['write', 'recipes', 'pages'], 'pages')).toBe(true)
    expect(apiKeyHasContentWriteScope(['write', 'pages'], 'recipes')).toBe(false)
  })

  it('schedule scope check requires write + content + schedule', () => {
    expect(apiKeyHasScheduleScope(['write', 'articles', 'schedule'], 'articles')).toBe(true)
    expect(apiKeyHasScheduleScope(['write', 'articles'], 'articles')).toBe(false)
    expect(apiKeyHasScheduleScope(['schedule', 'articles'], 'articles')).toBe(false)
    expect(apiKeyHasScheduleScope(['write', 'schedule', 'recipes'], 'articles')).toBe(false)
  })
})
