import { describe, expect, it } from 'vitest'
import {
  canAccessImport,
  canAccessMaintenance,
  canEditContent,
  canManageStaff,
  canManageUsers,
  canPublishContent,
} from '../../shared/abilities'

type TestUser = {
  id: number
  email: string
  username: string | null
  role: 'admin' | 'editor'
  createdAt: string
  updatedAt: string
}

const adminUser: TestUser = {
  id: 1,
  email: 'admin@journalducuistot.fr',
  username: 'admin',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-23T12:00:00.000Z',
}

const editorUser: TestUser = {
  ...adminUser,
  id: 2,
  email: 'editor@journalducuistot.fr',
  role: 'editor',
}

describe('nuxt-authorization abilities', () => {
  it('canEditContent allows admin and editor', async () => {
    expect(await canEditContent.execute(adminUser)).toBe(true)
    expect(await canEditContent.execute(editorUser)).toBe(true)
  })

  it('canPublishContent and staff/import/maintenance are admin-only', async () => {
    for (const ability of [
      canPublishContent,
      canManageStaff,
      canManageUsers,
      canAccessImport,
      canAccessMaintenance,
    ]) {
      expect(await ability.execute(adminUser)).toBe(true)
      expect(await ability.execute(editorUser)).toBe(false)
    }
  })

  it('abilities deny when no user is present', async () => {
    expect(await canEditContent.execute(null)).not.toBe(true)
    expect(await canManageStaff.execute(null)).not.toBe(true)
  })
})
