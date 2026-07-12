# ADR-001: Monorepo with `apps/web` and `apps/cms` (no Nuxt layer `extends`)

## Status

**Accepted** — T0 complete (2026-07-12)

## Context

The project began as a single Nuxt frontend (`cooking-blog`) backed by Strapi v5. A migration introduced `layers/layer-blog-cms`, a Nuxt layer holding the CMS API, Drizzle schemas, and server routes. `apps/web` (then the root app) used `extends: ['layers/layer-blog-cms']` to merge the layer into one Nuxt build.

That pattern created problems:

- **Blurred boundaries** — read (SSR pages) and write (CRUD API) lived in one merged config; it was unclear which app owned deployment, env vars, and ports.
- **Coupled dev experience** — layer `extends` is implicit; server routes, modules, and Nitro presets from the CMS leaked into the public frontend build.
- **Deployment mismatch** — the public site and the API backend have different scaling, caching, and infra needs (ISR + Redis on web; D1/R2/KV + cron on CMS). A single merged Worker or Node process does not map cleanly.
- **Independent iteration** — API versioning, auth, and migration tasks should evolve without rebuilding the entire frontend graph.

The implementation plan originally considered `packages/db` and layer inheritance. At T0 completion, the team chose **two sibling apps** in a pnpm workspace with **HTTP** as the integration boundary.

## Decision

1. Restructure into a pnpm monorepo with two workspace members:
   - **`apps/web`** — public Nuxt SSR frontend (port **3000**)
   - **`apps/cms`** — API-only Nuxt backend (port **3001**), evolved from `layer-blog-cms`

2. **Remove** the Nuxt layer pattern:
   - Delete / stop using `layers/layer-blog-cms`
   - Remove `extends` from web's `nuxt.config.ts`

3. Integrate web → CMS via **runtime configuration**, not module merge:

   ```ts
   runtimeConfig: {
     public: {
       cmsBaseUrl: process.env.NUXT_PUBLIC_CMS_BASE_URL || 'http://localhost:3001',
     },
   }
   ```

4. Provide a **Strapi-compatible adapter** in `apps/web/app/composables/useStrapi.ts` that translates `find()` calls to `$fetch(cmsBaseUrl + '/api/...')`, preserving existing page code that used `@nuxtjs/strapi`.

5. Pin **Nuxt 4.4.5** (pnpm catalog) with `future.compatibilityVersion: 5` on both apps.

## Consequences

### Positive

- **Clear ownership** — web = presentation + SEO + caching; cms = data + auth + publishing.
- **Independent ports and deploys** — each app can become its own Cloudflare Worker (or separate services) under Alchemy v2.
- **Explicit contract** — REST JSON over HTTP is easy to test, mock, and document.
- **Smaller web bundle** — no CMS server code, Drizzle, or auth middleware in the public build.

### Negative / trade-offs

- **Network hop** — every content fetch is HTTP (mitigated by ISR on web, future edge caching).
- **Duplicate types** — web cannot import Drizzle row types from CMS without a shared package; web uses hand-written or inferred response types (see [ADR-002](./adr-002-schemas-in-cms-not-shared-package.md)).
- **Two dev processes** — `pnpm dev` runs both apps; local setup requires CMS up for full page rendering.
- **Adapter maintenance** — `useStrapi.ts` must stay compatible with page-level `find()` usage until pages are refactored to native CMS client calls.

### Follow-ups

- Alchemy v2 stack for per-app Worker bindings ([`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md))
- Replace `@nuxtjs/mdc` with Comark on web
- Strapi extract pipeline on CMS
- Remove legacy root `app/` and `layers/` once migration is verified
