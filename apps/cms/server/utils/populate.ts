/**
 * Converts include query param to array of relation names.
 * Example: "cover,category,seo" -> ["cover", "category", "seo"]
 */
export function parseInclude(query: Record<string, any>): string[] {
  const include = query.include as string
  if (!include) return []
  if (include === '*') return ['*']
  return include.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Converts include strings to Drizzle `with` object.
 * Validates against an allowlist to prevent DoS via unknown relations.
 * Expands '*' wildcard using the allowedRelations map.
 *
 * @param includeList - e.g., ['cover', 'category'] or ['*']
 * @param allowedRelations - e.g., ['cover', 'category', 'seo']
 * @returns Drizzle with object, e.g., { cover: true, category: true }
 */
export function buildWithObject(
  includeList: string[],
  allowedRelations: string[],
): Record<string, true> {
  // Expand wildcard
  const expanded = includeList.includes('*')
    ? allowedRelations
    : includeList.filter(r => allowedRelations.includes(r))

  const result: Record<string, true> = {}
  for (const rel of expanded) {
    result[rel] = true
  }
  return result
}
