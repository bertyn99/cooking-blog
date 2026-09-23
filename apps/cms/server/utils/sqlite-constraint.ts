/** SQLite / D1 unique-constraint messages from insert/update failures. */
export function sqliteConstraintMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isSqliteUniqueConstraint(error: unknown): boolean {
  const message = sqliteConstraintMessage(error)
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|SQLITE_CONSTRAINT: UNIQUE/i.test(message)
}

export function isPageHomeUniqueConstraint(error: unknown): boolean {
  if (!isSqliteUniqueConstraint(error)) return false
  const message = sqliteConstraintMessage(error)
  if (/pages_is_home_locale_active_idx|is_home/i.test(message)) return true
  return /UNIQUE constraint failed: pages\.locale\b/i.test(message) && !/pages\.slug/i.test(message)
}

export function isPageSlugUniqueConstraint(error: unknown): boolean {
  if (!isSqliteUniqueConstraint(error)) return false
  const message = sqliteConstraintMessage(error)
  return /pages_slug_locale|pages\.slug/i.test(message)
}
