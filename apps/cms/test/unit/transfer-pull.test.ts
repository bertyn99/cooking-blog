import { describe, expect, it } from 'vitest'
import {
  isPrivateHostname,
  normalizeCmsOrigin,
  parseTransferPullInput,
  TRANSFER_PULL_CONFIRM_PHRASE,
} from '../../shared/transfer-pull'
import { sanitizeImportedRow } from '../../server/db/clone/transfer-pull'

describe('normalizeCmsOrigin', () => {
  it('normalizes https hosts', () => {
    expect(normalizeCmsOrigin('admin.example.com')).toBe('https://admin.example.com')
    expect(normalizeCmsOrigin('https://admin.example.com/')).toBe('https://admin.example.com')
  })

  it('blocks private and metadata hosts by default', () => {
    expect(() => normalizeCmsOrigin('http://localhost:3001')).toThrow('ORIGIN_PRIVATE')
    expect(() => normalizeCmsOrigin('http://169.254.169.254')).toThrow('ORIGIN_PRIVATE')
    expect(() => normalizeCmsOrigin('http://metadata.google.internal')).toThrow('ORIGIN_PRIVATE')
    expect(() => normalizeCmsOrigin('http://10.0.0.5')).toThrow('ORIGIN_PRIVATE')
    expect(normalizeCmsOrigin('http://localhost:3001', { allowPrivate: true }))
      .toBe('http://localhost:3001')
  })

  it('rejects credentials in URL', () => {
    expect(() => normalizeCmsOrigin('https://user:pass@admin.example.com')).toThrow('ORIGIN_INVALID')
  })
})

describe('isPrivateHostname', () => {
  it('detects CGNAT and link-local', () => {
    expect(isPrivateHostname('100.64.1.2')).toBe(true)
    expect(isPrivateHostname('169.254.1.1')).toBe(true)
    expect(isPrivateHostname('admin.example.com')).toBe(false)
  })
})

describe('parseTransferPullInput', () => {
  it('requires key and scopes', () => {
    expect(() => parseTransferPullInput({
      origin: 'https://admin.example.com',
      apiKey: '',
      scopes: ['articles'],
    })).toThrow('API_KEY_REQUIRED')
  })

  it('parses a valid body', () => {
    expect(parseTransferPullInput({
      origin: 'https://admin.example.com',
      apiKey: 'jdc_test',
      scopes: ['media', 'articles'],
      dryRun: true,
      confirm: TRANSFER_PULL_CONFIRM_PHRASE,
    })).toMatchObject({
      origin: 'https://admin.example.com',
      apiKey: 'jdc_test',
      scopes: ['articles', 'media'],
      dryRun: true,
    })
  })
})

describe('sanitizeImportedRow', () => {
  it('nulls author FKs and snake_cases keys', () => {
    expect(sanitizeImportedRow({
      id: 1,
      title: 'Hello',
      createdByUserId: 9,
      updatedByUserId: 8,
      fileMetadata: { a: 1 },
    })).toEqual({
      id: 1,
      title: 'Hello',
      created_by_user_id: null,
      updated_by_user_id: null,
      file_metadata: JSON.stringify({ a: 1 }),
    })
  })
})
