/** Pull/clone scopes — content readable via `/api/transfer/*`. */
export const TRANSFER_SCOPES = ['articles', 'recipes', 'media'] as const

/** Agent write scopes — draft mutations + MCP (not transfer-pull). */
export const AGENT_SCOPES = ['pages', 'write'] as const

/** All selectable scopes when creating a key in the admin UI. */
export const API_KEY_SCOPES = [...TRANSFER_SCOPES, ...AGENT_SCOPES] as const

export type TransferScope = (typeof TRANSFER_SCOPES)[number]
export type AgentScope = (typeof AGENT_SCOPES)[number]
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

export type ContentWriteScope = 'articles' | 'recipes' | 'pages'

export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  articles: 'Articles (transfert — tous statuts)',
  recipes: 'Recettes (transfert — tous statuts)',
  media: 'Médias (transfert — métadonnées + fichiers)',
  pages: 'Pages (agent — brouillons uniquement)',
  write: 'Écriture agent (MCP + API REST brouillons)',
}

export const TRANSFER_SCOPE_SET = new Set<string>(TRANSFER_SCOPES)
export const AGENT_SCOPE_SET = new Set<string>(AGENT_SCOPES)

export function isApiKeyScope(value: unknown): value is ApiKeyScope {
  return typeof value === 'string' && (API_KEY_SCOPES as readonly string[]).includes(value)
}

export function isTransferScope(value: unknown): value is TransferScope {
  return typeof value === 'string' && (TRANSFER_SCOPES as readonly string[]).includes(value)
}

export function normalizeApiKeyScopes(scopes: unknown): ApiKeyScope[] {
  if (!Array.isArray(scopes)) return []
  const unique = new Set<ApiKeyScope>()
  for (const item of scopes) {
    if (isApiKeyScope(item)) unique.add(item)
  }
  return API_KEY_SCOPES.filter(scope => unique.has(scope))
}

export function normalizeTransferScopes(scopes: unknown): TransferScope[] {
  return normalizeApiKeyScopes(scopes).filter(isTransferScope)
}

export function apiKeyHasScope(scopes: readonly string[], required: ApiKeyScope): boolean {
  return scopes.includes(required)
}

export function apiKeyHasWriteScope(scopes: readonly string[]): boolean {
  return apiKeyHasScope(scopes, 'write')
}

export function apiKeyHasContentWriteScope(
  scopes: readonly string[],
  contentScope: ContentWriteScope,
): boolean {
  return apiKeyHasWriteScope(scopes) && apiKeyHasScope(scopes, contentScope)
}
