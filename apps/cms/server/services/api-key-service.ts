import type { H3Event } from 'h3'
import { useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'
import {
  generateApiKeySecret,
  isApiKeyExpired,
  parseCreateApiKeyBody,
  parseUpdateApiKeyScopesBody,
  toPublicApiKey,
} from '../utils/api-key-crypto'

export function useApiKeyService(event: H3Event) {
  const queries = useQueries(event)

  return {
    async list(includeRevoked = false) {
      const rows = includeRevoked
        ? await queries.apiKeys.listAll()
        : await queries.apiKeys.listActive()
      return rows.map(toPublicApiKey)
    },

    async create(body: unknown, createdByUserId: number | null) {
      let parsed: ReturnType<typeof parseCreateApiKeyBody>
      try {
        parsed = parseCreateApiKeyBody(body)
      }
      catch {
        throw createApiError('VALIDATION_ERROR', 'Date d’expiration invalide.')
      }

      if (!parsed.name || parsed.name.length > 120) {
        throw createApiError('VALIDATION_ERROR', 'Nom de clé requis (max 120 caractères).')
      }
      if (parsed.scopes.length === 0) {
        throw createApiError(
          'VALIDATION_ERROR',
          'Sélectionnez au moins un droit (articles, recipes, pages, media, write).',
        )
      }

      const generated = generateApiKeySecret()
      const row = await queries.apiKeys.insert({
        name: parsed.name,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        scopes: parsed.scopes,
        createdByUserId,
        expiresAt: parsed.expiresAt,
      })

      return {
        key: toPublicApiKey(row),
        /** Shown once — never stored or returned again. */
        secret: generated.secret,
      }
    },

    async updateScopes(id: number, body: unknown) {
      const scopes = parseUpdateApiKeyScopesBody(body)
      if (scopes.length === 0) {
        throw createApiError(
          'VALIDATION_ERROR',
          'Sélectionnez au moins un droit (articles, recipes, pages, media, write).',
        )
      }

      const existing = await queries.apiKeys.findById(id)
      if (!existing) {
        throw createApiError('NOT_FOUND', 'Clé introuvable.')
      }
      if (existing.revokedAt) {
        throw createApiError(
          'FORBIDDEN',
          'Impossible de modifier une clé révoquée.',
          undefined,
          { fix: 'Créez une nouvelle clé avec les droits souhaités.' },
        )
      }

      const row = await queries.apiKeys.updateScopes(id, scopes)
      if (!row) {
        throw createApiError('NOT_FOUND', 'Clé introuvable ou déjà révoquée.')
      }
      return toPublicApiKey(row)
    },

    async revoke(id: number) {
      const row = await queries.apiKeys.revoke(id)
      if (!row) {
        throw createApiError('NOT_FOUND', 'Clé introuvable ou déjà révoquée.')
      }
      return toPublicApiKey(row)
    },

    async regenerate(id: number) {
      const existing = await queries.apiKeys.findById(id)
      if (!existing) {
        throw createApiError('NOT_FOUND', 'Clé introuvable.')
      }
      if (existing.revokedAt) {
        throw createApiError(
          'FORBIDDEN',
          'Impossible de régénérer une clé révoquée.',
          undefined,
          { fix: 'Créez une nouvelle clé ou supprimez cette entrée révoquée.' },
        )
      }
      if (isApiKeyExpired(existing.expiresAt)) {
        throw createApiError('FORBIDDEN', 'Impossible de régénérer une clé expirée.')
      }

      const generated = generateApiKeySecret()
      const row = await queries.apiKeys.rotateSecret(
        id,
        generated.keyPrefix,
        generated.keyHash,
      )
      if (!row) {
        throw createApiError('NOT_FOUND', 'Clé introuvable ou déjà révoquée.')
      }

      return {
        key: toPublicApiKey(row),
        secret: generated.secret,
      }
    },

    async purgeRevoked(id: number) {
      const existing = await queries.apiKeys.findById(id)
      if (!existing) {
        throw createApiError('NOT_FOUND', 'Clé introuvable.')
      }
      if (!existing.revokedAt) {
        throw createApiError(
          'FORBIDDEN',
          'Seules les clés révoquées peuvent être supprimées.',
          undefined,
          { fix: 'Révoquez la clé avant de la supprimer définitivement.' },
        )
      }

      await queries.auditEvents.detachApiKeyActor(id)
      const row = await queries.apiKeys.deleteRevoked(id)
      if (!row) {
        throw createApiError('NOT_FOUND', 'Clé introuvable ou non révoquée.')
      }
      return toPublicApiKey(row)
    },
  }
}
