import { describe, expect, it } from 'vitest'
import {
  applyContentStatusPolicy,
  applyInitialContentStatusPolicy,
} from '../../server/utils/content-status-policy'

const editor = {
  id: 2,
  email: 'editor@test.fr',
  username: 'editor',
  role: 'editor' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const admin = { ...editor, id: 1, role: 'admin' as const }

describe('applyContentStatusPolicy', () => {
  it('blocks editors from setting published status', () => {
    expect(() => applyContentStatusPolicy(
      editor,
      { status: 'draft' },
      { status: 'published' },
    )).toThrow()
  })

  it('allows editors to edit published content without status field', () => {
    const updates = applyContentStatusPolicy(
      editor,
      { status: 'published' },
      { title: 'Updated' } as { title: string, status?: string },
    )
    expect(updates).toEqual({ title: 'Updated' })
  })

  it('blocks editors from unpublishing via draft status', () => {
    expect(() => applyContentStatusPolicy(
      editor,
      { status: 'published' },
      { status: 'draft' },
    )).toThrow()
  })

  it('allows admins to publish and sets timestamps', () => {
    const updates = applyContentStatusPolicy(
      admin,
      { status: 'draft', firstPublishedAt: null },
      { status: 'published' },
    )
    expect(updates.status).toBe('published')
    expect(updates.publishedAt).toBeTruthy()
    expect(updates.firstPublishedAt).toBeTruthy()
    expect(updates.scheduledAt).toBeNull()
  })

  it('blocks editors from creating published content', () => {
    expect(() => applyInitialContentStatusPolicy(editor, { status: 'published' })).toThrow()
  })
})
