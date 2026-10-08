/**
 * Dedicated plain Worker hosting the ContentGenerationWorkflow class.
 *
 * Nitro v2 cannot emit extra worker exports (`exports.cloudflare.ts` is a
 * Nitro 3 / Nuxt 4.5.2 feature) — so the class lives here, in a plain async
 * worker, and the CMS worker cross-binds it via `scriptName`.
 *
 * ⚠️ Do not move this class back into the Nitro build until the CMS runs
 * Nitro 3 — the Workflows startup validation requires a real export.
 *
 * @see https://alchemy.run/providers/cloudflare/workflows/#workflow-binding-in-an-async-worker
 */
import { ContentGenerationWorkflow } from './server/workflows/content-generation'

export { ContentGenerationWorkflow }

export default {
  fetch: () => new Response('Not Found', { status: 404 }),
}
