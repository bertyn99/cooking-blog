/**
 * Extra Cloudflare Worker exports for Nitro (`cloudflare_module`).
 * Must not have a default export.
 *
 * Auto-detected by Nitro and included in the Alchemy `Website.Nuxt` Worker
 * entry (no custom `main` required).
 *
 * @see https://nitro.build/deploy/providers/cloudflare#additional-exports
 * @see https://alchemy.run/cloudflare/frontend/nuxt/
 */
export { ContentGenerationWorkflow } from './server/workflows/content-generation'
