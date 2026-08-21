import { describe, expect, it } from 'vitest'
import { applyApiKeyDraftPolicy } from '../../server/utils/content-status-policy'

describe('applyApiKeyDraftPolicy', () => {
  it('forces draft on create path', () => {
    expect(applyApiKeyDraftPolicy({ status: 'draft' }, {})).toEqual({ status: 'draft' })
  })

  it('rejects publish on create', () => {
    expect(() => applyApiKeyDraftPolicy({ status: 'draft' }, { status: 'published' }))
      .toThrow(/Les clés agent/)
  })

  it('rejects update on published row', () => {
    expect(() => applyApiKeyDraftPolicy({ status: 'published' }, { title: 'x' } as never))
      .toThrow()
  })
})
