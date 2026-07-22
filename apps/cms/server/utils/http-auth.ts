import type { H3Event } from 'h3'
import type { User } from '#auth-utils'
import {
  canEditContent,
  canManageStaff,
} from '../../shared/abilities'
import { createApiError } from './errors'

/** Attach session user to the evlog wide event for this request. */
export function attachRequestUser(event: H3Event, user: User | null | undefined) {
  if (!user?.id) return
  const log = useLogger(event as Parameters<typeof useLogger>[0])
  log.set({
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
    },
  })
}

export async function requireAuthenticatedSession(event: H3Event) {
  const session = await requireUserSession(event)
  attachRequestUser(event, session.user)
  return session
}

type AbilityLike = Parameters<typeof authorize>[1]

export async function requireAbility(event: H3Event, ability: AbilityLike) {
  const session = await requireAuthenticatedSession(event)
  const allowed = await ability.execute(session.user ?? null)
  if (!allowed) {
    throw createApiError('FORBIDDEN', 'Vous n’avez pas les droits pour cette action.')
  }
  return session
}

export async function requireEditor(event: H3Event) {
  return requireAbility(event, canEditContent)
}

export async function requireAdmin(event: H3Event) {
  return requireAbility(event, canManageStaff)
}
