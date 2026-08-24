import type { H3Event } from 'nitro/h3'
import type { AppDb } from '../db/create-db'
import { createApiError } from '../utils/errors'
import { useDb } from '../utils/db'
import { createUserQueries } from '../db/queries/users'
import type { CreateStaffUserInput, UpdateStaffUserInput } from '../../shared/validators/staff'
import { toSessionUser } from '../utils/auth/user'
import { bumpUserAuthRevocation } from '../utils/session-user'

export function createStaffService(db: AppDb, event: H3Event) {
  const users = createUserQueries(db)

  return {
    list(page: number, pageSize: number) {
      return users.listStaff({ page, pageSize })
    },

    async create(input: CreateStaffUserInput) {
      if (await users.emailExists(input.email)) {
        throw createApiError('VALIDATION_ERROR', 'Cet email est déjà utilisé.')
      }

      const passwordHash = await hashPassword(input.password)
      const row = await users.insert({
        email: input.email,
        username: input.username ?? null,
        passwordHash,
        role: input.role,
        isActive: true,
      })

      if (!row) {
        throw createApiError('INTERNAL_ERROR', 'Impossible de créer l’utilisateur.')
      }

      return toSessionUser(row)
    },

    async update(
      targetId: number,
      actorId: number,
      input: UpdateStaffUserInput,
    ) {
      const existing = await users.findById(targetId)
      if (!existing) {
        throw createApiError('NOT_FOUND', 'Utilisateur introuvable.')
      }

      if (existing.role === 'agent') {
        throw createApiError('FORBIDDEN', 'Le compte agent système ne peut pas être modifié.')
      }

      if (input.role === 'editor' && existing.role === 'admin') {
        const otherAdmins = await users.countActiveAdmins(targetId)
        if (otherAdmins === 0) {
          throw createApiError(
            'CONFLICT',
            'Impossible de retirer le dernier administrateur actif.',
          )
        }
      }

      if (input.isActive === false && existing.role === 'admin') {
        const otherAdmins = await users.countActiveAdmins(targetId)
        if (otherAdmins === 0) {
          throw createApiError(
            'CONFLICT',
            'Impossible de désactiver le dernier administrateur actif.',
          )
        }
      }

      if (targetId === actorId && input.role === 'editor') {
        throw createApiError(
          'CONFLICT',
          'Vous ne pouvez pas retirer votre propre rôle administrateur.',
        )
      }

      if (targetId === actorId && input.isActive === false) {
        throw createApiError(
          'CONFLICT',
          'Vous ne pouvez pas désactiver votre propre compte.',
        )
      }

      const updated = await users.updateStaff(targetId, {
        username: input.username,
        role: input.role,
        isActive: input.isActive,
      })

      if (!updated) {
        throw createApiError('NOT_FOUND', 'Utilisateur introuvable.')
      }

      const roleChanged = input.role !== undefined && input.role !== existing.role
      const activeChanged = input.isActive !== undefined && input.isActive !== existing.isActive
      if (roleChanged || activeChanged) {
        await bumpUserAuthRevocation(event, targetId)
      }

      return updated
    },
  }
}

export function useStaffService(event: H3Event) {
  return createStaffService(useDb(event), event)
}
