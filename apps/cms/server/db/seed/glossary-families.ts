import type { AppDb } from '../create-db'
import { createGlossaryQueries, type GlossaryFamilyBackfillStats } from '../queries/glossary'

/** Idempotent: set parentId on known culinary forms. Never copies covers. */
export async function seedGlossaryFamilies(
  db: AppDb,
  locale = 'fr',
): Promise<GlossaryFamilyBackfillStats> {
  return createGlossaryQueries(db).backfillKnownIngredientFamilies(locale)
}
