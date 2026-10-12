/**
 * Link curated culinary forms (lait d’amande → Amande) on the local libSQL db.
 * Does not copy covers. Does not create missing forms — only missing family roots.
 *
 *   pnpm db:seed:glossary-families
 *   pnpm task:seed:glossary-families
 */
import { getLocalDb } from '../server/db/client'
import { seedGlossaryFamilies } from '../server/db/seed/glossary-families'

async function main() {
  const db = getLocalDb()
  const stats = await seedGlossaryFamilies(db)

  console.log(
    `[seed:glossary-families] rootsCreated=${stats.rootsCreated} formsLinked=${stats.formsLinked} skipped=${stats.skipped}`,
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[seed:glossary-families] failed — ${message}`)
  process.exitCode = 1
})
