import type { User } from '#auth-utils'

/** Shape required to build a session user (matches a Drizzle `users` row). */
export interface SessionUserInput {
  id: number
  email: string
  username: string | null
  role: 'admin' | 'editor'
  createdAt: string
  updatedAt: string
}

/**
 * Builds the safe session user object from a DB row.
 * Strips `passwordHash` and any other sensitive fields.
 */
export function toSessionUser(user: SessionUserInput): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username ?? null,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
