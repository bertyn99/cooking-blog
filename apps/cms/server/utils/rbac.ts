/**
 * Role-Based Access Control (RBAC) helpers.
 *
 * Role hierarchy:
 * - `admin`: full access — content CRUD + user management
 * - `editor`: content CRUD only — no user management
 *
 * Usage in handlers:
 * ```ts
 * // Editor + admin allowed
 * requireRole(event, ['editor', 'admin'])
 *
 * // Admin only
 * requireRole(event, ['admin'])
 * ```
 */
import type { H3Event } from 'h3'
import { createApiError } from './errors'
import type { JwtPayload, UserRole } from './auth'

/**
 * Roles recognized by the system.
 * Kept in sync with `users.role` enum in `server/db/schema/users.ts`.
 */
export const ALLOWED_ROLES: readonly UserRole[] = ['admin', 'editor'] as const

/**
 * Ensures the authenticated user (read from `event.context.user`) has one of
 * the allowed roles. Throws a 403 FORBIDDEN error if not.
 *
 * @param event - H3 event; must have `event.context.user` populated by auth middleware
 * @param roles - Roles allowed to perform the action
 * @returns The authenticated user's JWT payload for downstream use
 */
export function requireRole(event: H3Event, roles: UserRole[]): JwtPayload {
  const user = event.context?.user as JwtPayload | undefined

  if (!user) {
    throw createApiError('UNAUTHORIZED', 'Authentication required')
  }

  if (!roles.includes(user.role)) {
    throw createApiError(
      'FORBIDDEN',
      `Role '${user.role}' is not permitted to perform this action`,
      { requiredRoles: roles, actualRole: user.role }
    )
  }

  return user
}

/**
 * Convenience guard: must be admin.
 */
export function requireAdmin(event: H3Event): JwtPayload {
  return requireRole(event, ['admin'])
}

/**
 * Convenience guard: editor or admin (any authenticated content author).
 */
export function requireEditor(event: H3Event): JwtPayload {
  return requireRole(event, ['editor', 'admin'])
}
