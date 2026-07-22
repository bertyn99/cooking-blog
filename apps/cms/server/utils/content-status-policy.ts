import type { User } from '#auth-utils'
import { createApiError } from './errors'

type PublishableStatus = 'draft' | 'published' | 'scheduled'

export interface ContentStatusPatch {
  status?: PublishableStatus
  publishedAt?: string | null
  scheduledAt?: string | null
  firstPublishedAt?: string | null
}

function assertAdminStatusTransition(
  user: User | null,
  from: PublishableStatus,
  to: PublishableStatus,
) {
  if (user?.role === 'admin') return

  if (to === 'published' || to === 'scheduled') {
    throw createApiError(
      'FORBIDDEN',
      'Seuls les administrateurs peuvent publier ou planifier du contenu.',
      undefined,
      {
        why: `Le rôle « ${user?.role ?? 'anonyme'} » ne peut pas passer de « ${from} » à « ${to} ».`,
        fix: 'Enregistrez en brouillon ou demandez à un administrateur de publier.',
      },
    )
  }

  if (to === 'draft' && (from === 'published' || from === 'scheduled')) {
    throw createApiError(
      'FORBIDDEN',
      'Seuls les administrateurs peuvent dépublier du contenu.',
      undefined,
      {
        why: 'Utilisez les actions de publication admin ou demandez à un administrateur.',
        fix: 'Enregistrez les modifications sans changer le statut.',
      },
    )
  }
}

/**
 * Gate publish / schedule / unpublish transitions on PUT and create.
 * Editors may edit published content when `status` is omitted or unchanged.
 */
export function applyContentStatusPolicy<T extends ContentStatusPatch>(
  user: User | null,
  existing: { status: PublishableStatus, firstPublishedAt?: string | null },
  updates: T,
): T {
  if (updates.status === undefined) {
    return updates
  }

  const nextStatus = updates.status
  if (nextStatus === existing.status) {
    return updates
  }

  assertAdminStatusTransition(user, existing.status, nextStatus)

  if (nextStatus === 'published') {
    const now = new Date().toISOString()
    updates.publishedAt = updates.publishedAt ?? now
    if (!existing.firstPublishedAt) {
      updates.firstPublishedAt = now
    }
    updates.scheduledAt = null
  }

  if (nextStatus === 'scheduled' && updates.scheduledAt === undefined) {
    throw createApiError(
      'VALIDATION_ERROR',
      'scheduledAt est requis pour le statut « scheduled ».',
    )
  }

  if (nextStatus === 'draft') {
    updates.publishedAt = updates.publishedAt ?? null
    updates.scheduledAt = updates.scheduledAt ?? null
  }

  return updates
}

/** Initial status on create (treated as transition from draft). */
export function applyInitialContentStatusPolicy<T extends ContentStatusPatch>(
  user: User | null,
  updates: T & { status?: PublishableStatus },
): T {
  const status = updates.status ?? 'draft'
  return applyContentStatusPolicy(
    user,
    { status: 'draft', firstPublishedAt: null },
    { ...updates, status },
  )
}
