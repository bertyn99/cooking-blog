/** Selectable scopes for machine API keys (admin-created). */
export const API_KEY_SCOPES = ['articles', 'recipes', 'media'] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  articles: 'Articles (tous statuts, brouillons inclus)',
  recipes: 'Recettes (tous statuts, brouillons inclus)',
  media: 'Médias (métadonnées + téléchargement)',
}

export function isApiKeyScope(value: unknown): value is ApiKeyScope {
  return typeof value === 'string' && (API_KEY_SCOPES as readonly string[]).includes(value)
}

export function normalizeApiKeyScopes(scopes: unknown): ApiKeyScope[] {
  if (!Array.isArray(scopes)) return []
  const unique = new Set<ApiKeyScope>()
  for (const item of scopes) {
    if (isApiKeyScope(item)) unique.add(item)
  }
  return API_KEY_SCOPES.filter(scope => unique.has(scope))
}

export function apiKeyHasScope(scopes: readonly string[], required: ApiKeyScope): boolean {
  return scopes.includes(required)
}
