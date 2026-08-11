import { defineAbility } from 'nuxt-authorization/utils'
import type { User } from '#auth-utils'

export const canEditContent = defineAbility((user: User | null) => {
  return user?.role === 'admin' || user?.role === 'editor'
})

/** Publish, schedule, unpublish content (admin only for now). */
export const canPublishContent = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

/** Staff directory: list, create, change role, deactivate users. */
export const canManageStaff = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

/** @deprecated Use `canManageStaff` — kept for register route and tests. */
export const canManageUsers = canManageStaff

export const canAccessImport = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

export const canAccessMaintenance = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

/** Create / revoke machine API keys (transfer pull, future integrations). */
export const canManageApiKeys = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

/**
 * Legacy umbrella for admin-only tooling.
 * Prefer specific abilities (`canPublishContent`, `canAccessImport`, …).
 */
export const canAccessAdminApi = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})
