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

  it('rejects update on published row in draft-only mode', () => {
    expect(() => applyApiKeyDraftPolicy({ status: 'published' }, { title: 'x' } as never))
      .toThrow()
  })

  it('allows in-place edits on published rows without changing status', () => {
    expect(applyApiKeyDraftPolicy({ status: 'published' }, {}, 'in-place')).toEqual({})
    expect(applyApiKeyDraftPolicy({ status: 'scheduled' }, {}, 'in-place').status).toBeUndefined()
  })

  it('rejects publish and unpublish in in-place mode', () => {
    expect(() => applyApiKeyDraftPolicy({ status: 'draft' }, { status: 'published' }, 'in-place'))
      .toThrow(/Les clés agent/)
    expect(() => applyApiKeyDraftPolicy({ status: 'published' }, { status: 'draft' }, 'in-place'))
      .toThrow(/Les clés agent/)
  })
})
