import { defineAbility } from 'nuxt-authorization/utils'
import type { User } from '#auth-utils'

export const canEditContent = defineAbility((user: User | null) => {
  return user?.role === 'admin' || user?.role === 'editor'
})

export const canManageUsers = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})

export const canAccessAdminApi = defineAbility((user: User | null) => {
  return user?.role === 'admin'
})
