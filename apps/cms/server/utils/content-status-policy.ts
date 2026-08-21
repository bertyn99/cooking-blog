import type { User } from '#auth-utils'
import type { Actor } from './actor'
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

/** API-key writes: draft-only; reject live rows and publish attempts. */
export function applyApiKeyDraftPolicy(
  existing: { status: PublishableStatus },
  updates: ContentStatusPatch,
): ContentStatusPatch {
  if (existing.status !== 'draft') {
    throw createApiError(
      'FORBIDDEN',
      'Ce contenu est publié ou planifié — les agents ne peuvent modifier que des brouillons.',
      undefined,
      {
        why: `Statut actuel : « ${existing.status} ».`,
        fix: 'Créez un nouveau brouillon ou demandez une republication manuelle.',
      },
    )
  }

  if (updates.status !== undefined && updates.status !== 'draft') {
    throw createApiError(
      'FORBIDDEN',
      'Les clés agent ne peuvent pas publier ou planifier du contenu.',
      undefined,
      { fix: 'Enregistrez en brouillon ; un humain publiera ensuite.' },
    )
  }

  return { ...updates, status: 'draft' }
}

/**
 * Unified status policy for session editors/admins and API-key agents.
 */
export function applyContentPolicy(
  actor: Actor,
  existing: { status: PublishableStatus, firstPublishedAt?: string | null } | null,
  updates: ContentStatusPatch,
): ContentStatusPatch {
  if (actor.kind === 'apiKey') {
    const base = existing ?? { status: 'draft' as const, firstPublishedAt: null }
    return applyApiKeyDraftPolicy(base, updates)
  }

  if (existing) {
    return applyContentStatusPolicy(actor.user, existing, updates)
  }

  return applyInitialContentStatusPolicy(actor.user, updates)
}

/**
 * Gate publish / schedule / unpublish transitions on PUT and create.
 * Editors may edit published content when `status` is omitted or unchanged.
 */
export function applyContentStatusPolicy(
  user: User | null,
  existing: { status: PublishableStatus, firstPublishedAt?: string | null },
  updates: ContentStatusPatch,
): ContentStatusPatch {
  if (updates.status === undefined) {
    return { ...updates }
  }

  const nextStatus = updates.status
  if (nextStatus === existing.status) {
    return { ...updates }
  }

  assertAdminStatusTransition(user, existing.status, nextStatus)

  const patch: ContentStatusPatch = { ...updates }

  if (nextStatus === 'published') {
    const now = new Date().toISOString()
    patch.publishedAt = patch.publishedAt ?? now
    if (!existing.firstPublishedAt) {
      patch.firstPublishedAt = now
    }
    patch.scheduledAt = null
  }

  if (nextStatus === 'scheduled' && patch.scheduledAt === undefined) {
    throw createApiError(
      'VALIDATION_ERROR',
      'scheduledAt est requis pour le statut « scheduled ».',
    )
  }

  if (nextStatus === 'draft') {
    patch.publishedAt = patch.publishedAt ?? null
    patch.scheduledAt = patch.scheduledAt ?? null
  }

  return patch
}

/** Initial status on create (treated as transition from draft). */
export function applyInitialContentStatusPolicy(
  user: User | null,
  updates: ContentStatusPatch & { status?: PublishableStatus },
): ContentStatusPatch {
  const status = updates.status ?? 'draft'
  return applyContentStatusPolicy(
    user,
    { status: 'draft', firstPublishedAt: null },
    { ...updates, status },
  )
}

