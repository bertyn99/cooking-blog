import type { H3Event } from 'h3'
import { useQueries } from '../utils/db'
import { createApiError } from '../utils/errors'
import {
  generateApiKeySecret,
  parseCreateApiKeyBody,
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
          'Sélectionnez au moins un droit (articles, recipes, media).',
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

    async revoke(id: number) {
      const row = await queries.apiKeys.revoke(id)
      if (!row) {
        throw createApiError('NOT_FOUND', 'Clé introuvable ou déjà révoquée.')
      }
      return toPublicApiKey(row)
    },
  }
}
