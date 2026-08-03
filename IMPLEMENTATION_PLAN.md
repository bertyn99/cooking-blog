# Strapi → Nuxt Monorepo (Web + CMS + Alchemy v2)

> **Plan revision**: 2026-07-12 — NuxtHub removed; [Alchemy v2](https://v2.alchemy.run/) for infra; pnpm monorepo (`apps/web` + `apps/cms`); [@comark/nuxt](https://comark.dev/rendering/nuxt) for markdown; Strapi extract as Nitro task.

## TL;DR

> **Quick Summary**: Reorganize into a **pnpm monorepo** with two Nuxt apps — `apps/web` (public SSR frontend) and `apps/cms` (API-only backend, evolved from `layer-blog-cms`) — plus shared `packages/db`. Provision **Cloudflare D1, R2, KV** via **Alchemy v2** (`alchemy.run.ts`). Migrate content with a **Strapi extract pipeline** (per-entity services + orchestrator task). Render markdown with **Comark** (not `@nuxtjs/mdc`). All CMS content stays in **D1** (not Nuxt Content).
>
> **Deliverables**:
> - Monorepo layout: `apps/web`, `apps/cms`, `packages/db`, `infra/`, root `alchemy.run.ts`
> - Alchemy v2 stack: D1 + R2 (media) + KV (cache/rate-limit) + Worker bindings + Cron
> - Drizzle schemas (shared package) for all 5 Strapi content types + components
> - Full CRUD API in `apps/cms` with locale filtering, auth, publishing workflow
> - Strapi extract: `server/tasks/strapi-extract.ts` + `server/services/extract/*` per entity
> - Strapi-compatible adapter in `apps/web` (`useStrapi.ts`, supports `populate: "*"`)
> - Comark rendering on article/recipe/page detail views (streaming-capable)
>
> **Estimated Effort**: Large (T0 monorepo + T-ALCHEMY + T-EXTRACT + 14 CMS tasks + 4 verification)
> **Parallel Execution**: YES — after T0 + T-ALCHEMY foundation
> **Critical Path**: T0 → T-ALCHEMY → T2 → T3 → T-EXTRACT → T8 → T13 → T14-COMARK → F1-F4

---

## Context

### Original Request
Migrate from Strapi v5 CMS to a custom Nuxt layer. Focus first on building the layer backend (database schemas + API) and the Strapi compatibility adapter. Admin UI and data migration come in a separate plan.

### Interview Summary
- **Motivation**: Simplify stack — one unified TypeScript monorepo (web + CMS API)
- **Nuxt version**: Nuxt 4 (^4.4.5 via pnpm catalog) on both apps
- **Infrastructure**: [Alchemy v2](https://v2.alchemy.run/) — D1, R2, KV, Cron (NOT NuxtHub)
- **Media Storage**: Cloudflare R2 via Alchemy `Cloudflare.R2.Bucket` binding
- **Page/Article content**: Comark markdown strings in D1 (migrated from Strapi dynamic zones → markdown). **Pages do not store dynamic-zone JSON** — see [ADR-005](docs/architecture/adr-005-page-content-markdown-not-dynamic-zones.md) and [CMS ↔ Strapi schema audit](docs/architecture/cms-strapi-schema-audit.md).
- **Markdown rendering**: [@comark/nuxt](https://comark.dev/rendering/nuxt) — auto-imported `<Comark>`, streaming support, `~/components/prose` overrides
- **Content store**: D1 for all CMS entities (articles, recipes, pages, categories) — NOT Nuxt Content
- **Auth**: Multi-user JWT + RBAC on CMS API (admin UI deferred)
- **API Design**: Clean REST API on `apps/cms` + Strapi-compat adapter in `apps/web`
- **Data migration**: Strapi extract Nitro task with per-entity extract services
- **Testing**: Vitest unit tests + Alchemy `alchemy/Test/Vitest` for integration (isolated stages)
- **i18n**: `locale` + `locale_group_id` on all content tables from day one

### Architecture v2 (decisions)

#### Monorepo layout

```
journalducuistot/                    # pnpm workspace root (current: cooking-blog/)
├── alchemy.run.ts                   # Alchemy v2 Stack — composition root
├── infra/
│   ├── resources/                   # D1, R2, KV, Worker definitions (optional split)
│   └── migrations/                  # Drizzle-generated SQL (committed)
├── packages/
│   └── db/                          # Shared Drizzle schema + types (@journalducuistot/db)
├── apps/
│   ├── web/                         # Public SSR frontend (was cooking-blog root)
│   │   ├── app/                     # pages, components, composables
│   │   ├── server/                  # sitemap, rss, legacy redirects
│   │   └── nuxt.config.ts           # @comark/nuxt, @nuxtjs/seo, NO Strapi module
│   └── cms/                         # API-only backend (was layers/layer-blog-cms)
│       ├── server/                  # CRUD, auth, extract, tasks
│       └── nuxt.config.ts           # API-only, nitro cloudflare preset
├── pnpm-workspace.yaml
└── package.json                       # alchemy deploy / dev scripts
```

**Why two apps instead of a Nuxt layer?**
- Clear separation: `apps/web` = read/SSR, `apps/cms` = write/API
- Independent dev ports (`web:3000`, `cms:3001`)
- Alchemy can deploy each as its own Worker (or one Worker in early phase — see spike)
- Better DX: no `extends` magic, explicit `$fetch` to CMS base URL

`apps/web` consumes `apps/cms` via `runtimeConfig.public.cmsBaseUrl` (not layer merge).

#### Alchemy v2 (replaces NuxtHub)

| Concern | Alchemy v2 | Docs |
|---------|------------|------|
| Stack entry | `export default Alchemy.Stack(..., Effect.gen(...))` | [Getting started](https://v2.alchemy.run/getting-started) |
| D1 | `yield* Cloudflare.D1.Database("DB", { migrationsDir })` | [D1](https://v2.alchemy.run/cloudflare/data/d1) |
| R2 media | `yield* Cloudflare.R2.Bucket("Media")` | [R2](https://v2.alchemy.run/cloudflare/data/r2) |
| KV cache | `yield* Cloudflare.KV.Namespace("Cache")` | [KV](https://v2.alchemy.run/cloudflare/data/kv) |
| Deploy | `alchemy deploy` / `alchemy dev` | [Local dev](https://v2.alchemy.run/environments/local-development) |
| Migrations | `Drizzle.Schema` + `migrationsDir` on D1 | [Drizzle](https://v2.alchemy.run/drizzle/migrations) |
| Cron | `Worker({ crons: ["*/5 * * * *"] })` + Nitro `defineTask` | [Cron](https://v2.alchemy.run/cloudflare/messaging/cron) |
| Testing | `alchemy/Test/Vitest` isolated stages | [Testing](https://v2.alchemy.run/testing) |
| Monorepo | Single stack at workspace root | [Monorepo](https://v2.alchemy.run/project-structure/monorepo) |

**Bindings in Nitro** (replaces `hub:db`, `hub:blob`, `hub:kv`):

```ts
// apps/cms/server/utils/db.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '@journalducuistot/db/schema'

export function useDb(event: H3Event) {
  const env = event.context.cloudflare.env  // typed via Cloudflare.InferEnv
  return drizzle(env.DB, { schema })
}
```

**Removed entirely**: `@nuxthub/core`, `hub: { db, blob, kv }`, `hub:db` / `hub:blob` / `hub:kv` virtual modules, `nuxt db generate`.

**Spike required**: [Alchemy Nuxt page](https://v2.alchemy.run/cloudflare/frontend/nuxt) states Nuxt SSR is not yet a first-class Alchemy resource. Validate `nuxt build` (cloudflare preset) → `Cloudflare.Worker` with D1/R2 bindings before full migration. Fallback: Alchemy provisions resources; Nitro deploys separately until Nuxt support lands.

**v1 → v2**: If any v1 Alchemy code exists, read [Migrating from v1](https://v2.alchemy.run/migrating-from-v1). Use `alchemy login` (profiles in `~/.alchemy/profiles.json`) — do NOT export `CLOUDFLARE_API_TOKEN` in docs/runbooks.

#### Comark (replaces @nuxtjs/mdc for content rendering)

| Before | After |
|--------|-------|
| `@nuxtjs/mdc` + `<MDC :value="content">` | `@comark/nuxt` + `<Comark>{{ content }}</Comark>` |
| `app/components/prose/Prose*.vue` | `app/components/prose/*.vue` (Comark auto-registers) |
| Strapi dynamic zones via `BaseContentDisplay` | Comark markdown in D1 `content` column |

**`apps/web/nuxt.config.ts`**:
```ts
export default defineNuxtConfig({
  modules: ['@comark/nuxt', /* ... */],
})
```

**Detail pages** (article, recipe intro, CMS pages):
```vue
<Comark class="prose lg:prose-xl" :streaming="false">
  {{ article.content }}
</Comark>
```

Use `:streaming="true"` + `caret` only for live preview / AI-assisted editing (future admin). See [Comark Nuxt docs](https://comark.dev/rendering/nuxt) and [Migrating from MDC](https://comark.dev/).

**Custom Vue blocks** in markdown: map via `:components="{ alert: Alert }"` or prose overrides in `~/components/prose/`.

#### Strapi extract pipeline

```
apps/cms/server/
├── tasks/
│   └── strapi-extract.ts              # defineTask orchestrator
└── services/extract/
    ├── base.ts                        # Strapi client, pagination, rate limit
    ├── articles.ts
    ├── recipes.ts                     # includes ingredients, nutrition, reviews
    ├── categories.ts
    ├── category-articles.ts
    ├── pages.ts                       # dynamic zone → Comark markdown
    ├── media.ts                       # Strapi /uploads → R2
    └── seo.ts
```

**Orchestration order** (FK dependencies): `media (partial)` → `categories` → `category-articles` → `articles` / `recipes` → `pages` → `seo`

**Idempotency**: `legacy_strapi_map` table (`content_type`, `strapi_document_id`, `local_id`, `locale`)

**Trigger**: `npx nuxt task run strapi-extract` (manual, pre-cutover) — NOT on every request.

#### NuxtHub → Alchemy v2 mapping (for task updates below)

| Old (NuxtHub plan) | New (Alchemy v2) |
|--------------------|------------------|
| `import { db } from 'hub:db'` | `useDb(event)` → `drizzle(env.DB)` |
| `import { blob } from 'hub:blob'` | `event.context.cloudflare.env.Media` (R2) |
| `import { kv } from 'hub:kv'` | `event.context.cloudflare.env.Cache` (KV) |
| `blob.serve(event, pathname)` | Custom `server/routes/images/[...pathname].get.ts` using R2 `get()` |
| `nuxt db generate` | `drizzle-kit generate` or `Drizzle.Schema` in Alchemy |
| NuxtHub CRON | Alchemy `Worker({ crons })` + Nitro `defineTask` |
| `extends: ['layers/layer-blog-cms']` | `apps/web` → `$fetch(cmsBaseUrl + '/api/...')` |

> **Note**: Tasks T1–T14 below retain their original structure. Where they mention NuxtHub or `hub:*`, apply the mapping table above.

### Current State (Verified)
- **pnpm workspace**: Partial — only `layers/*` in workspace; needs T0 monorepo restructure
- **CMS code**: `layers/layer-blog-cms/` has schemas, CRUD routes, auth — to move to `apps/cms`
- **Frontend**: Root `app/`, `nuxt.config.ts` — to move to `apps/web`
- **NuxtHub in layer**: `@nuxthub/core` still in `layer-blog-cms/nuxt.config.ts` — **remove in T-ALCHEMY**
- **MDC in web**: `@nuxtjs/mdc` on article pages — **replace with @comark/nuxt in T14-COMARK**
- **Strapi still live**: sitemap/RSS/detail pages hit `admin.journalducuistot.fr` — extract + adapter pending
- **Nuxt 5 compat**: `future: { compatibilityVersion: 5 }` on both apps
- **Nuxt SEO**: `@nuxtjs/seo: ^3.0.3` in web — upgrade to v5
- **Lockfile**: `pnpm-lock.yaml` out of sync with layer `package.json` — run `pnpm install` before tests

### Strapi Content Types (to replicate)
- **Article**: title, content (richtext), cover (media), slug (uid), seo (repeatable component), category (manyToOne → CategoryArticle), firstPublishedAt, draft/publish, i18n
- **Recipe**: title, intro, cover, ingredients (repeatable component: name, qty, unit), category (manyToOne → Category), step (richtext), slug, difficulty (enum: easy/medium/hard), time (int), nutrition (component), reviews (repeatable component), seo, firstPublishedAt, draft/publish, i18n
- **Category** (recipes): name, desc, img (multiple media), slug, recipes (oneToMany)
- **CategoryArticle**: name, slug, articles (oneToMany)
- **Page**: name, title, slug, content (dynamic zone → MDC markdown), parent (self-ref), seoMeta

### cooking-blog API Consumption (verified query shapes the adapter must support)
1. `find('articles', { populate: "*", sort: ["publishedAt:desc"], pagination: { page: 1, pageSize: 5 } })` — homepage
2. `find('recipes', { populate: "*", sort: ["publishedAt:desc"], pagination: { page: 1, pageSize: 4 } })` — homepage
3. `find('articles', { filters: { slug: {$eq}, category: {slug: {$eq}} }, populate: ["cover","category","seo","surround"] })` — article detail
4. `find('recipes', { filters: {slug: {$eq}}, populate: ["cover","category","nutrition","ingredients","seo"] })` — recipe detail
5. `find('pages', { filters: {slug, parent: {slug}}, populate: {content:true, seoMeta:true, parent:{fields:['slug']}} })` — page detail
6. `$fetch('...api/pages?populate[parent][populate][0]=parent&pagination[pageSize]=100...')` — sitemap
7. `$fetch('...api/articles?pagination[pageSize]=100&populate=category...')` — sitemap
8. `$fetch('...api/recipes?pagination[pageSize]=100...')` — sitemap
9. Same patterns for RSS feed (server/routes/rss.xml.ts)

**Key insight**: cooking-blog uses `populate: "*"` (wildcard) on homepage queries. Adapter MUST support this.

---

## Work Objectives

### Core Objective
Build a **pnpm monorepo** with `apps/cms` (API backend), `apps/web` (SSR frontend), shared `packages/db`, and **Alchemy v2** infra. Migrate Strapi data via extract pipeline. Render content with **Comark**.

### Concrete Deliverables
- `alchemy.run.ts` — Alchemy v2 Stack (D1, R2, KV, Workers, Cron)
- `packages/db/` — Shared Drizzle schemas + types
- `apps/cms/server/` — CRUD, auth, media (R2), extract services, scheduled publish
- `apps/web/app/composables/useStrapi.ts` — Strapi-compatible adapter → CMS API
- `apps/web` — Comark rendering, no `@nuxtjs/mdc`, no `@nuxtjs/strapi`
- `apps/cms/server/tasks/strapi-extract.ts` — Orchestrated migration from Strapi

### Definition of Done
- [ ] Monorepo structure: `apps/web`, `apps/cms`, `packages/db`, root `alchemy.run.ts`
- [ ] Alchemy v2 deploys D1 + R2 + KV bindings (spike validated)
- [ ] All 5 content types in D1 with locale fields
- [ ] Strapi extract populates D1 + R2 from production Strapi (dry-run + full run)
- [ ] `apps/web` renders articles/recipes/pages with `<Comark>` (no Strapi, no MDC)
- [ ] `apps/cms` CRUD + auth + publishing workflow functional
- [ ] `pnpm test` passes in both apps + Alchemy integration test (optional stage)
- [ ] `apps/cms` has NO UI dependencies

### Must Have
- Alchemy v2 stack with D1, R2, KV bindings ([docs](https://v2.alchemy.run/llms.txt))
- Monorepo with `apps/web` + `apps/cms` + `packages/db`
- Drizzle ORM schemas in shared package (locale fields from start)
- Strapi extract: per-entity services + orchestrator task + `legacy_strapi_map`
- CRUD API on `apps/cms` with populate, locale filtering, draft protection
- Publishing workflow + Cron via Alchemy Worker `crons` + Nitro `defineTask`
- Media upload to R2 (not NuxtHub Blob)
- JWT auth + RBAC on CMS write endpoints
- Comark (`@comark/nuxt`) on web app for markdown rendering
- Strapi-compatible adapter in `apps/web` (`useStrapi.ts`, `populate: "*"`)
- TDD: Vitest unit tests; Alchemy staged integration tests for CMS API
- Consistent error format: `{ error: { code, message, details? } }`
- Zod validation on all write endpoints

### Must NOT Have (Guardrails)
- **NO NuxtHub** — use Alchemy v2 only
- **NO Nuxt layer `extends`** — two separate apps, HTTP between them
- **NO Nuxt Content** for CMS entities — D1 is canonical
- **NO @nuxtjs/mdc** on web — use @comark/nuxt
- **NO admin UI** — deferred
- **NO generic Strapi emulator** — adapter supports ONLY exact queries web uses
- **NO UI dependencies in apps/cms**
- **NO `as any` / `@ts-ignore`**
- **NO OAuth/social login**
- **NO Strapi password migration**

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Vitest configured in layer-blog-cms with unit/nuxt/e2e projects)
- **Automated tests**: YES (TDD — RED → GREEN → REFACTOR)
- **Framework**: Vitest (unit + nuxt projects)

### QA Policy
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Database**: Use Bash (wrangler D1 execute) — Query D1, assert rows
- **Frontend**: Use Playwright — Verify cooking-blog renders content

### Error Response Contract
All API errors return:
```json
{
  "error": {
    "code": "NOT_FOUND" | "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```
HTTP status: 400 (validation), 401 (no token), 403 (wrong role), 404 (not found), 500 (internal).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Foundation — 3 tasks, sequential):
├── T0: Monorepo restructure (apps/web + apps/cms + packages/db)
├── T-ALCHEMY: Alchemy v2 stack (D1, R2, KV, Cron) — depends T0
└── T-EXTRACT: Strapi extract pipeline — depends T-ALCHEMY + T3 schemas

Wave 1 (CMS foundation — 5 tasks):
├── T1: Clean cms app, strip UI deps [quick]
├── T2: Drizzle + D1 via Alchemy bindings [quick]
├── T3: Core schemas in packages/db [quick]
├── T4: Component schemas [quick]
└── T5: Shared API utilities [quick]

Wave 2 (Core API — 7 tasks, max parallel):
├── T6-T12: Auth, media (R2), CRUD APIs, SEO

Wave 3 (Integration — 2 tasks):
├── T13: Publishing + Cron (Alchemy Worker crons)
└── T14: Web adapter + Comark migration

Wave FINAL: F1-F4 reviews
```

Critical Path: **T0 → T-ALCHEMY → T3 → T-EXTRACT → T8 → T13 → T14 → F1-F4**

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 | - | T2, T7 | 1 |
| T2 | T1 | T3, T4, T5 | 1 |
| T3 | T2 | T6, T8-T14 | 1 |
| T4 | T2 | T9, T12 | 1 |
| T5 | T2 | T6-T12 | 1 |
| T6 | T3, T5 | - | 2 |
| T7 | T1 | T14 | 2 |
| T8 | T3, T5 | T13, T14 | 2 |
| T9 | T3, T4, T5 | T13, T14 | 2 |
| T10 | T3, T5 | T13, T14 | 2 |
| T11 | T3, T5 | T13, T14 | 2 |
| T12 | T3, T4, T5 | T14 | 2 |
| T13 | T8, T9, T10, T11 | - | 3 |
| T14 | T7-T12 | - | 3 |

### Key Structural Changes from Previous Plan
1. **T5 (shared utilities) ADDED** — prevents code duplication across CRUD tasks
2. **i18n (old T14) ELIMINATED** — locale filtering baked into T3/T4 schemas + T8-T11 CRUD from start
3. **T13 (publishing) now depends on ALL CRUD APIs** (T8-T11) not just articles
4. **T1 strips UI dependencies** — layer becomes API-only
5. **Media (T7) non-blocking for CRUD** — T8-T11 store `cover_blob_pathname` as text, don't wait for T7
6. **All tasks have QA scenarios** — no gaps

### Agent Dispatch Summary

- **Wave 1**: 5 agents — T1 → `unspecified-high`, T2-T5 → `quick`
- **Wave 2**: 7 agents — T6 → `deep`, T7-T12 → `unspecified-high`
- **Wave 3**: 2 agents — T13 → `deep`, T14 → `deep`
- **FINAL**: 4 agents — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] T0. Monorepo restructure (apps/web + apps/cms + packages/db)

  **What to do**:
  - Create monorepo layout per **Architecture v2** above
  - Move current root `app/`, `nuxt.config.ts`, `server/`, `public/` → `apps/web/`
  - Move `layers/layer-blog-cms/` → `apps/cms/` (drop `extends` pattern)
  - Extract Drizzle schemas from `apps/cms/server/db/schema/` → `packages/db/src/schema/`
  - Update `pnpm-workspace.yaml`:
    ```yaml
    packages:
      - 'apps/*'
      - 'packages/*'
    catalog:
      nuxt: '^4.4.5'
      drizzle-orm: 'latest'
      zod: 'latest'
    ```
  - Root `package.json` scripts: `dev:web`, `dev:cms`, `dev` (parallel), `build`, `test`
  - `apps/web`: add `runtimeConfig.public.cmsBaseUrl` (default `http://localhost:3001`)
  - `apps/cms`: API-only, no `app/pages`, port 3001
  - Remove `extends: ['layers/layer-blog-cms']` from web config
  - Run `pnpm install` to sync lockfile

  **Acceptance Criteria**:
  - [ ] `pnpm --filter web dev` starts frontend on :3000
  - [ ] `pnpm --filter cms dev` starts CMS API on :3001
  - [ ] `packages/db` importable from both apps
  - [ ] No `layers/` directory remains

  **Commit**: YES — `chore: restructure to pnpm monorepo (apps/web + apps/cms + packages/db)`

- [ ] T-ALCHEMY. Alchemy v2 infrastructure stack

  **What to do**:
  - Install: `alchemy`, `effect` (see [getting started](https://v2.alchemy.run/getting-started))
  - Create root `alchemy.run.ts` with `Alchemy.Stack` + `Cloudflare.providers()` + `Drizzle.providers()`
  - Provision resources:
    - `Cloudflare.D1.Database("DB", { migrationsDir: "./infra/migrations" })`
    - `Cloudflare.R2.Bucket("Media")`
    - `Cloudflare.KV.Namespace("Cache")`
  - **Spike**: `Command.Build` for `apps/cms` → `Cloudflare.Worker` with `env: { DB, Media, Cache }`, `crons: ["*/5 * * * *"]`
  - Remove `@nuxthub/core` from `apps/cms`; replace all `hub:db` / `hub:blob` / `hub:kv` with `useDb(event)` + R2/KV via `event.context.cloudflare.env`
  - Both apps: `nitro.preset: 'cloudflare_module'`, `compatibility.flags: ['nodejs_compat']`
  - Root scripts: `"deploy": "alchemy deploy"`, `"dev:infra": "alchemy dev"`
  - Auth: `alchemy login` (profiles) — document in README, never hardcode CF tokens
  - Migrations: `Drizzle.Schema` in stack OR `drizzle-kit generate` → `infra/migrations/`

  **References**:
  - [Alchemy v2](https://v2.alchemy.run/)
  - [D1](https://v2.alchemy.run/cloudflare/data/d1) · [R2](https://v2.alchemy.run/cloudflare/data/r2) · [KV](https://v2.alchemy.run/cloudflare/data/kv)
  - [Drizzle migrations](https://v2.alchemy.run/drizzle/migrations) · [Monorepo](https://v2.alchemy.run/project-structure/monorepo)
  - [Nuxt status](https://v2.alchemy.run/cloudflare/frontend/nuxt) — validate spike before prod deploy

  **Acceptance Criteria**:
  - [ ] `alchemy deploy` provisions D1 + R2 + KV (confirm before each deploy)
  - [ ] `GET /api/health` on CMS returns DB ping via `env.DB`
  - [ ] No `@nuxthub/core` or `hub:*` imports remain
  - [ ] Cron trigger attached to CMS Worker

  **Commit**: YES — `feat(infra): add Alchemy v2 stack (D1, R2, KV, Cron)`

- [ ] T-EXTRACT. Strapi extract pipeline (per-entity services)

  **What to do**:
  - Add `legacy_strapi_map` table to `packages/db`
  - Create `apps/cms/server/services/extract/` — one file per Strapi content type:
    - `base.ts` — Strapi REST client (`STRAPI_URL` env), pagination, rate limit
    - `articles.ts`, `recipes.ts`, `categories.ts`, `category-articles.ts`, `pages.ts`, `media.ts`, `seo.ts`
  - Each extractor: fetch → transform → upsert D1 (idempotent via `legacy_strapi_map`) → delegate media to R2
  - `pages.ts`: convert Strapi dynamic zones → Comark markdown (replace `BaseContentDisplay` block arrays)
  - `recipes.ts`: nested ingredients, nutrition, reviews in one pass
  - Create `apps/cms/server/tasks/strapi-extract.ts`:
    ```ts
    export default defineTask({
      meta: { name: 'strapi-extract', description: 'Import all content from Strapi' },
      async run() {
        // orchestrate in FK order; return { created, updated, errors }
      },
    })
    ```
  - CLI: `pnpm --filter cms exec nuxt task run strapi-extract`
  - TDD: unit tests per extractor with Strapi JSON fixtures (no live Strapi in CI)

  **Acceptance Criteria**:
  - [ ] Dry-run against staging D1: record counts match Strapi (+/- locale rows)
  - [ ] Re-run is idempotent (no duplicates)
  - [ ] Media files land in R2 with pathname preserved for `/uploads/` rewrite
  - [ ] Pages store Comark markdown, not JSON dynamic zones

  **Commit**: YES — `feat(cms): add Strapi extract pipeline with per-entity services`

- [ ] 1. Clean starter template, strip UI deps, create server/ skeleton

  **What to do**:
  - Delete starter template content: `app/pages/index.vue`, `app/components/AppLogo.vue`, `app/components/TemplateMenu.vue`
  - Replace `app/app.vue` with minimal `<NuxtPage />` wrapper (or delete entirely if layer has no UI)
  - Delete `app/app.config.ts` if it only contains UI theme colors
  - Delete `app/assets/css/main.css` if it only contains Tailwind/UI styles
  - **Strip unnecessary dependencies** from `package.json`:
    - REMOVE: `@nuxt/ui`, `@nuxt/a11y`, `@nuxt/image`, `@nuxt/scripts`, `@nuxtjs/i18n`, `@pinia/nuxt`, `pinia`, `tailwindcss`, `@iconify-json/lucide`, `@iconify-json/simple-icons`, `@unhead/vue`
    - KEEP: `nuxt` (catalog), `@nuxthub/core`, `evlog`, `@nuxt/test-utils`, `vitest`, `typescript`, `vue-tsc`, `@vue/test-utils`, `@vitest/coverage-v8`, `@vitest/browser-playwright`, `eslint`, `@nuxt/eslint`
    - ADD (dev): `drizzle-kit`
    - ADD: `drizzle-orm`, `zod`, `@libsql/client` (for local SQLite dev with NuxtHub v0.10)
  - Update `nuxt.config.ts`:
    - Remove routeRules
    - Set modules to: `['@nuxthub/core', '@nuxt/eslint', 'evlog']`
    - Add NuxtHub v0.10 config: `hub: { db: 'sqlite', blob: true, kv: true, cache: true }` (NOTE: v0.10 uses `db: 'sqlite'` NOT `database: true`)
    - **Add Nuxt 5 compatibility**: `future: { compatibilityVersion: 5 }` — opts into Nuxt 5 behavior (Vite Environment API, normalized page names, non-async callHook, comment node placeholders). Nitro v3 comes with this.
    - **Enable Nitro tasks** (experimental in Nitro v3): `nitro: { experimental: { tasks: true } }` — required for `defineTask()` and `scheduledTasks` in T13
  - Create `server/` directory structure: `server/api/`, `server/middleware/`, `server/utils/`, `server/utils/validations/`, `server/db/`, `server/db/schema/`, `server/tasks/`, `server/routes/`
  - Create `server/db/schema.ts` placeholder (NuxtHub v0.10 auto-discovers schema files in `server/db/schema/`) — NO manual drizzle.config.ts needed (auto-generated)
  - Clean `app/` directory — remove all starter content. Layer is API-only; `app/` can be empty or deleted.
  - Verify `extends: ['layers/layer-blog-cms']` works from cooking-blog
  - Run `pnpm install` to update lockfile after dep changes
  - TDD: Test that layer loads without error
  - Create `server/api/health.get.ts` — Health check endpoint: returns 200 OK + `SELECT 1` DB ping

  **Must NOT do**:
  - Keep any starter template content
  - Leave unnecessary UI dependencies
  - Add global styles conflicting with consuming app
  - Install drizzle-orm or configure DB schema (that's T2). But DO add `@libsql/client` to deps for local dev.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`nuxt`, `nuxt-modules`, `pnpm`]

  **Parallelization**:
  - **Blocks**: T2, T7 | **Blocked By**: None

  **References**:
  - `cooking-blog/layers/layer-blog-cms/nuxt.config.ts` — Current config (has routeRules, UI modules)
  - `cooking-blog/layers/layer-blog-cms/app/app.vue` — Current starter template (77 lines, full UHeader/UFooter)
  - `cooking-blog/layers/layer-blog-cms/package.json` — Current deps (heavy)
  - Nuxt Layers: https://nuxt.com/docs/getting-started/layers

  **Acceptance Criteria**:
  - [ ] Starter template content deleted (no AppLogo, TemplateMenu, index.vue)
  - [ ] `app/` directory empty or contains only minimal app.vue
  - [ ] `server/` directory exists with subdirectories (api, middleware, utils, db, db/schema, tasks, routes)
  - [ ] `package.json` has NO @nuxt/ui, pinia, tailwindcss, @nuxtjs/i18n
  - [ ] `package.json` HAS drizzle-orm, zod, @nuxthub/core, evlog
  - [ ] `pnpm dev` starts without error (dev server, not content)
  - [ ] `pnpm test` passes

  **QA Scenarios:**
  ```
  Scenario: Layer has no UI dependencies
    Tool: Bash
    Steps: cd cooking-blog/layers/layer-blog-cms && node -e "const p=require('./package.json'); const bad=['@nuxt/ui','@pinia/nuxt','pinia','tailwindcss','@nuxtjs/i18n','@nuxt/image']; const found=bad.filter(d=>p.dependencies?.[d]||p.devDependencies?.[d]); if(found.length) {console.error('FAIL: still has',found); process.exit(1)} console.log('PASS')"
    Expected Result: PASS (exit code 0)
    Evidence: .sisyphus/evidence/task-1-no-ui-deps.txt

  Scenario: No starter template content remains
    Tool: Bash
    Steps: test ! -f app/components/AppLogo.vue && test ! -f app/components/TemplateMenu.vue && test ! -f app/pages/index.vue
    Expected Result: All starter files deleted (exit code 0)
    Evidence: .sisyphus/evidence/task-1-starter-clean.txt

  Scenario: Server directory structure exists
    Tool: Bash
    Steps: for d in server/api server/middleware server/utils server/db server/db/schema server/tasks server/routes; do test -d "$d" || { echo "MISSING: $d"; exit 1; }; done && echo "PASS"
    Expected Result: PASS (exit code 0)
    Evidence: .sisyphus/evidence/task-1-server-dirs.txt
  ```

  **Commit**: YES — `feat(layer): clean starter, strip UI deps, create server skeleton`

- [ ] 2. Drizzle ORM + D1 database setup

  **What to do**:
  - **NuxtHub v0.10 handles most of this automatically!** The `db` instance from `hub:db` is a pre-configured Drizzle ORM instance.
  - NO manual `drizzle.config.ts` — NuxtHub auto-generates it at build time
  - NO `server/utils/db.ts` with `useDB()` — use `import { db, tables, schema } from 'hub:db'` directly in server routes
  - The `hub:db` virtual module is auto-imported on server-side. You can use `db` directly without explicit import in server routes.
  - Verify the setup works by running `npx nuxt db generate` (should produce empty migration since no schemas yet)
  - Add scripts to package.json:
    - `"db:generate": "nuxt db generate"` (NOT `drizzle-kit generate`)
    - `"db:migrate": "nuxt db migrate"`
  - Create `server/db/schema.ts` as empty placeholder barrel (populated in T3/T4):
    ```ts
    // Schema files in server/db/schema/ are auto-discovered by NuxtHub
    // This file is intentionally empty — schemas added in T3/T4
    ```
  - **Foreign Key Enforcement**: D1 enforces foreign keys BY DEFAULT (unlike standard SQLite). NO PRAGMA or plugin needed. FK constraints defined via Drizzle `references()` with `onDelete` rules are automatically enforced.

  - Create schema files with actual table definitions (that's T3/T4)
    - Create API routes
    - Create manual `drizzle.config.ts` (NuxtHub auto-generates it)

  **Recommended Agent Profile**:
  - **Category**: `quick` | **Skills**: [`drizzle-orm`, `nuxthub`, `drizzle-migrations`]
  - **Blocks**: T3, T4, T5 | **Blocked By**: T1

  **References**:
  - NuxtHub v0.10 Database: https://hub.nuxt.com/docs/database (READ THIS — v0.10 breaking changes)
    - NuxtHub Migration Guide: https://hub.nuxt.com/docs/getting-started/migration
    - Drizzle D1: https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1

  **Acceptance Criteria**:
  - [ ] `drizzle-orm`, `drizzle-kit`, and `@libsql/client` in dependencies
    - [ ] `import { db } from 'hub:db'` works in a test server route (returns Drizzle instance)
    - [ ] NO manual `drizzle.config.ts` file exists (NuxtHub auto-generates)
    - [ ] `npx nuxt db generate` runs without error (produces empty migration with placeholder schema)
    - [ ] `hub:db` virtual module resolves correctly

  **QA Scenarios:**
  ```
  Scenario: NuxtHub DB integration works
    Tool: Bash
    Steps:
      1. cd cooking-blog/layers/layer-blog-cms
      2. Create test server route: echo 'export default defineEventHandler(async () => { const result = await db.run(sql\`SELECT 1 as test\`); return result })' > server/api/test-db.get.ts
      3. Start dev server and curl http://localhost:3000/api/test-db
      4. Delete test route: rm server/api/test-db.get.ts
    Expected Result: Returns { test: 1 } proving Drizzle + D1 integration works
    Evidence: .sisyphus/evidence/task-2-db-integration.json
  ```

  **Commit**: YES — `feat(layer): add Drizzle ORM + D1 setup`

- [ ] 3. Database schema: core content types (with locale fields)

  **What to do**:
  - Create `server/db/schema/articles.ts` (NuxtHub v0.10 uses `server/db/schema/` NOT `server/database/schema/`):
    - Fields: id (integer PK), title (text), content (text), slug (text), cover_blob_pathname (text FK→blobs.pathname, nullable), category_id (integer FK→category_articles ON DELETE SET NULL), first_published_at (text ISO nullable), status (text: draft|published|scheduled), published_at (text ISO nullable), scheduled_at (text ISO nullable), locale (text default 'fr'), locale_group_id (text), deleted_at (text ISO nullable, for soft deletes), created_at, updated_at
    - **Composite unique constraint**: `UNIQUE(slug, locale)` — slug unique PER LOCALE, not globally (i18n fix)
    - Indexes: status, locale, locale_group_id, published_at, (slug, locale) composite
  - Create `server/db/schema/recipes.ts`:
    - Fields: id, title, intro, slug, cover_blob_pathname (text FK→blobs.pathname), category_id (FK→categories ON DELETE SET NULL), step (text), difficulty (text: easy|medium|hard), time (integer), first_published_at, status, published_at, scheduled_at, locale, locale_group_id, deleted_at, created_at, updated_at
    - Same `UNIQUE(slug, locale)` composite constraint
    - Same indexes as articles
  - Create `server/db/schema/categories.ts`:
    - categories table: id, name, desc, slug, locale, locale_group_id, status, published_at, deleted_at, created_at, updated_at
      - **No more `img_blob_ids` JSON column** — use junction table (see below)
      - `UNIQUE(slug, locale)` composite constraint
    - category_blobs junction table: category_id (FK→categories ON DELETE CASCADE), blob_pathname (text FK→blobs.pathname ON DELETE CASCADE), sort_order (int) — replaces `img_blob_ids` JSON for native Drizzle relation population
    - category_articles table: id, name, slug, locale, locale_group_id, status, published_at, deleted_at, created_at, updated_at
      - `UNIQUE(slug, locale)` composite constraint
  - Create `server/db/schema/pages.ts`:
    - Fields: id, name, title, slug, content (text — MDC markdown), parent_id (integer FK→pages self-ref ON DELETE SET NULL, nullable), status, published_at, scheduled_at, locale, locale_group_id, deleted_at, created_at, updated_at
    - `UNIQUE(slug, locale)` composite constraint
    - Index on parent_id
  - Create `server/db/schema/users.ts`:
    - Fields: id, email (text unique), username, password_hash, role (text: admin|editor), created_at, updated_at
  - Update barrel export in `schema.ts`
  - **No TDD for schema structure** — TypeScript types provide compile-time correctness; rely on `pnpm db:generate` producing valid SQL (M1: TDD on schemas is low-value boilerplate)

  **Must NOT do**:
  - Create component tables (T4) or API routes
  - Create migration files (auto-generated)

  **Recommended Agent Profile**:
  - **Category**: `quick` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T6, T8-T14 | **Blocked By**: T2

  **References**:
  - `cooking-admin/src/api/article/content-types/article/schema.json` — Article fields
  - `cooking-admin/src/api/recipe/content-types/recipe/schema.json` — Recipe fields
  - `cooking-admin/src/api/category/content-types/category/schema.json` — Category fields
  - `cooking-admin/src/api/category-article/content-types/category-article/schema.json` — CategoryArticle fields
  - `cooking-admin/src/api/page/content-types/page/schema.json` — Page fields

  **Acceptance Criteria**:
  - [ ] All 6 schema files exist (articles, recipes, categories, category_articles, pages, users)
  - [ ] `pnpm db:generate` produces valid SQL with CREATE TABLE for all tables
  - [ ] All content tables have: locale, locale_group_id, status, published_at, deleted_at (soft delete), created_at, updated_at
    - [ ] All content tables have `UNIQUE(slug, locale)` composite constraint (NOT global slug unique)
    - [ ] No `img_blob_ids` JSON column — uses `category_blobs` junction table instead
    - [ ] All FK references define `ON DELETE` behavior (SET NULL for content relations, CASCADE for junction tables)

  **QA Scenarios:**
  ```
  Scenario: Schema generates valid D1 migration
    Tool: Bash
    Steps: cd cooking-blog/layers/layer-blog-cms && rm -rf server/db/migrations/* && pnpm db:generate && grep -c "CREATE TABLE" server/db/migrations/**/*.sql
    Expected Result: 6+ CREATE TABLE statements (articles, recipes, categories, category_articles, pages, users)
    Evidence: .sisyphus/evidence/task-3-schema-migration.sql

  Scenario: Locale fields present in all content tables
    Tool: Bash
    Steps: grep -l "locale" server/db/schema/articles.ts server/db/schema/recipes.ts server/db/schema/categories.ts server/db/schema/pages.ts
    Expected Result: All 4 files match
    Evidence: .sisyphus/evidence/task-3-locale-fields.txt
  ```

  **Commit**: YES — `feat(layer): add Drizzle schemas for core content types with locale`

- [ ] 4. Database schema: component/embedded types

  **What to do**:
  - Create `server/db/schema/ingredients.ts` — id, recipe_id (FK), name, qty (real), unit (text: none|g|mg|kg|l|ml|cuillere_soupe|cuillere_cafe|tasse), sort_order
  - Create `server/db/schema/nutrition.ts` — id, recipe_id (FK unique), lipides, proteine, sucre, calories, glucides, sodium (all text)
  - Create `server/db/schema/reviews.ts` — id, recipe_id (FK), star (int), content, author_name, created_at
  - Create `server/db/schema/seo.ts` — **CRITICAL: NO polymorphic relations** (Drizzle cannot filter `with` by content_type). Use nullable FKs instead:
    - Fields: id, article_id (int FK→articles ON DELETE CASCADE, nullable), recipe_id (int FK→recipes ON DELETE CASCADE, nullable), page_id (int FK→pages ON DELETE CASCADE, nullable), description (text max 160), keywords (text), meta_robots (text default 'index, follow')
    - Only ONE of article_id/recipe_id/page_id should be set per row
    - This allows native Drizzle `with: { seo: true }` to work correctly on each content type
  - Create `server/db/schema/social-meta.ts` — id, seo_id (FK→seo ON DELETE CASCADE), social_network (text: Facebook|Twitter), title (text max 60), description (text max 65), image_blob_pathname (text FK→blobs.pathname)
  - Create `server/db/schema/blobs.ts` — **PK is `pathname` (text), NOT integer id** (NuxtHub Blob uses pathname as identifier). Fields: pathname (text PK), original_name, mime_type, size, width, height, alt_text, created_at, updated_at
  - Schemas in `server/db/schema/` are auto-discovered by NuxtHub v0.10 — NO manual barrel export needed
    - Run `npx nuxt db generate` to generate migrations (NOT `drizzle-kit generate`)
    - **No TDD for schema structure** (M1)

  **Recommended Agent Profile**:
  - **Category**: `quick` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T9, T12 | **Blocked By**: T2
  - **Can Run In Parallel**: YES with T3

  **References**:
  - `cooking-admin/src/components/recipe/ingredients.json` — name, qty (decimal), unit (enum)
  - `cooking-admin/src/components/recipe/nutritional-information.json` — lipides, proteine, sucre, calories, glucides, sodium
  - `cooking-admin/src/components/recipe/rate.json` — star (int), content (text)
  - `cooking-admin/src/components/shared/seo.json` — metaSocial, metaRobots, description, keywords
  - `cooking-admin/src/components/shared/meta-social.json` — socialNetwork, title, description, image

  **Acceptance Criteria**:
  - [ ] All 6 component schema files exist
    - [ ] `seo` schema uses nullable FKs (article_id, recipe_id, page_id) — NOT polymorphic content_type/content_id
    - [ ] `blobs` table uses `pathname` as PK (text), not integer id
    - [ ] `pnpm db:generate` produces 13+ CREATE TABLE statements total (core + component + category_blobs junction)

  **QA Scenarios:**
  ```
  Scenario: All schemas generate valid SQL
    Tool: Bash
    Steps: cd cooking-blog/layers/layer-blog-cms && rm -rf server/db/migrations/* && pnpm db:generate && grep -c "CREATE TABLE" server/db/migrations/**/*.sql
    Expected Result: 12+ CREATE TABLE statements
    Evidence: .sisyphus/evidence/task-4-component-schemas.sql
  ```

  **Commit**: YES — `feat(layer): add component/embedded type schemas`

- [ ] 5. Shared API utilities (pagination, populate, validation, errors, slug)

  **What to do**:
  - Create `server/utils/pagination.ts`:
    - `parsePagination(query)` — Converts `?page=1&pageSize=10` to `{ offset, limit }`
    - **Cap pageSize at 100** (H9: prevent DoS via large page sizes)
    - `paginateResult(data, total, page, pageSize)` — Returns `{ data, meta: { pagination: { page, pageSize, pageCount, total } } }`
  - Create `server/utils/populate.ts`:
    - `parseInclude(query)` — Converts `?include=cover,category,seo` to `string[]`
    - **NO generic `resolvePopulate`** (H2: redundant with Drizzle's native `with` API). Instead:
    - `buildWithObject(includeList, allowedRelations)` — Converts include strings to Drizzle `with` object
      - Example: `['cover', 'category']` → `{ cover: true, category: true }`
      - **Validates against allowlist** (H9: rejects unknown relations like `users`, `password_hash`)
      - Expands `'*'` wildcard using `allowedRelations` map passed by caller (H3: each CRUD task passes its own relation map)
    - Example: `buildWithObject(['*'], ['cover', 'category', 'seo'])` → `{ cover: true, category: true, seo: true }`
  - Create `server/utils/errors.ts`:
    - **`createApiError(code, message, details?)`** (H5: renamed from `createError` to avoid shadowing H3's built-in `createError`)
    - Internally uses H3's `createError({ statusCode, statusMessage, data })` to ensure client-side `$fetch` error handling works
    - Error codes: NOT_FOUND, VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, INTERNAL_ERROR
  - Create `server/utils/slug.ts`:
    - **`slugifyString(title)`** (M3: renamed from `generateSlug` to avoid collision with client-side `generateSlug` in `cooking-blog/app/utils/format.ts`)
    - slugify: lowercase, hyphenated, accent-stripped for French (é→e, à→a, ç→c)
    - **`slugifyUnique(title, locale, db, tableName)`** (M8: checks DB for existing slugs, appends `-2`, `-3` on collision)
    - `generateNestedSlug(slug, parent)` — For pages with parent hierarchy (this one CAN match client-side name since it's server-only)
  - Create `server/utils/validations/` directory (M2: co-located per-domain, NOT centralized in one file):
    - `server/utils/validations/articles.ts` — `createArticleSchema`, `updateArticleSchema`
    - `server/utils/validations/recipes.ts` — `createRecipeSchema`, `updateRecipeSchema`
    - `server/utils/validations/categories.ts` — `createCategorySchema`
    - `server/utils/validations/pages.ts` — `createPageSchema`
    - `server/utils/validate.ts` — `validateBody(schema, data)` wrapper, throws VALIDATION_ERROR on failure
    - **`validateQuery(params, allowedIncludes)`** (H9: validates query parameters including `?include=` allowlist, returns sanitized values)
  - TDD: Comprehensive tests for ALL utilities

  **Must NOT do**:
  - Create API routes (CRUD tasks do that)
    - Hardcode content-type-specific logic in shared utils (keep generic)
    - Create a centralized `validate.ts` with all Zod schemas (M2: co-locate per-domain instead)

  **Recommended Agent Profile**:
  - **Category**: `quick` | **Skills**: [`drizzle-orm`, `nuxt`]
  - **Blocks**: T6-T12 | **Blocked By**: T2

  **References**:
  - `cooking-blog/app/utils/format.ts` — Existing client-side `generateSlug` with parent hierarchy (server util renamed to `slugifyString` to avoid confusion)
    - Strapi pagination format: `{ data: [...], meta: { pagination: { page, pageSize, pageCount, total } } }`

  **Acceptance Criteria**:
  - [ ] All utility files exist with exported functions
    - [ ] `parseInclude` validates against allowlist (rejects `users`, `password_hash`, etc.)
    - [ ] `buildWithObject` correctly expands `'*'` using caller-provided relation map
    - [ ] `createApiError` (NOT `createError`) — does not shadow H3's built-in
    - [ ] `slugifyString` (NOT `generateSlug`) — no naming collision
    - [ ] `slugifyUnique` handles collisions by appending suffix
    - [ ] Zod schemas co-located per-domain in `server/utils/validations/`
    - [ ] Pagination caps pageSize at 100
    - [ ] Error format matches the Error Response Contract
    - [ ] Slug generation handles French accents (é→e, à→a, ç→c)
    - [ ] All utility tests pass

  **QA Scenarios:**
  ```
  Scenario: Pagination utility produces correct shape
    Tool: Bash
    Steps: cd cooking-blog/layers/layer-blog-cms && pnpm test -- --filter "pagination" 2>&1
    Expected Result: Tests pass, output shows correct pagination meta shape
    Evidence: .sisyphus/evidence/task-5-pagination-tests.txt

  Scenario: Error format matches contract
    Tool: Bash
    Steps: cd cooking-blog/layers/layer-blog-cms && pnpm test -- --filter "errors" 2>&1
    Expected Result: Tests pass, errors have { error: { code, message } } shape
    Evidence: .sisyphus/evidence/task-5-error-tests.txt
  ```

  **Commit**: YES — `feat(layer): add shared API utilities — pagination, populate, validation, errors, slug`

- [ ] 6. Auth system (JWT + RBAC for API)

  **What to do**:
  - Create `server/utils/auth.ts`:
    - Password hashing via Web Crypto API: **PBKDF2 with SHA-256, 100,000+ iterations** (C1: Web Crypto does NOT support scrypt — must use PBKDF2 explicitly). Format: `pbkdf2:100000:sha256:salt:hash`
    - JWT token generation/validation using Web Crypto HMAC-SHA256
    - **JWT expiration: 1 hour** (M6: short-lived access tokens)
    - **JWT secret loaded from `process.env.JWT_SECRET`** (M6: never hardcoded, fail if missing)
    - `hashPassword(password)` / `verifyPassword(password, hash)`
    - `signJwt(payload)` — Adds `exp: Math.floor(Date.now()/1000) + 3600`
    - `verifyJwt(token)` — Validates signature AND expiration
    - **`sanitizeUser(user)`** (M7: strips `password_hash` from user objects — NEVER return it)
  - Create `server/api/auth/login.post.ts` — Email + password → JWT. **Implement rate limiting using NuxtHub KV** (M5: `import { kv } from 'hub:kv'`, track `login:fail:${ip}` counter with 15min TTL, block after 5 failures). Return `sanitizeUser()` output, never the raw user row.
    - Create `server/api/auth/register.post.ts` — Admin-only user creation, **EXCEPT bootstrap** (H6: if `SELECT COUNT(*) FROM users = 0`, allow first registration without auth — solves first-admin lockout)
    - Create `server/api/auth/session.get.ts` — Current user from JWT, returns `sanitizeUser()` output
  - Create `server/middleware/auth.ts`:
    - Validate JWT on `/api/**` POST/PUT/DELETE
    - Skip GET requests (public read — BUT see H7: CRUD APIs must auto-filter drafts)
    - Skip `/api/auth/**` and `/api/health` routes
  - Create `server/utils/rbac.ts` — `requireRole(event, roles)` helper; admin (full), editor (content CRUD, no user management)
  - TDD: Tests for login, register, token validation, RBAC enforcement

  **Must NOT do**:
  - Build login UI (deferred)
    - Add OAuth/social login
    - Migrate Strapi passwords
    - Use Node.js-only crypto (must work on Cloudflare Workers)
    - Use scrypt/argon2/bcrypt (not supported by Web Crypto API — C1)

  **Recommended Agent Profile**:
  - **Category**: `deep` | **Skills**: [`nuxt`, `nodejs-backend-patterns`]
  - **Blocked By**: T3, T5

  **References**:
  - `cooking-admin/config/plugins.ts` — Current Strapi auth setup
  - Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

  **Acceptance Criteria**:
  - [ ] Login returns JWT token **with 1h expiration**
    - [ ] Login has rate limiting (max 5 attempts per IP per 15min)
    - [ ] First admin can be created via bootstrap (register works when user count = 0)
    - [ ] JWT secret loaded from `process.env.JWT_SECRET`
    - [ ] Password hashing uses PBKDF2 (NOT scrypt)
    - [ ] `password_hash` NEVER appears in any API response (verified by sanitizeUser)
    - [ ] Auth middleware blocks unauthenticated writes (POST/PUT/DELETE)
    - [ ] Auth middleware allows unauthenticated reads (GET)
    - [ ] RBAC: admin can do everything, editor cannot manage users
    - [ ] Tests pass
    - [ ] No Node.js-only APIs (Workers-compatible)

  **QA Scenarios:**
  ```
  Scenario: Login returns JWT
    Tool: Bash
    Steps:
      1. Insert user in DB directly via wrangler d1 execute
      2. curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@test.com","password":"test123"}'
    Expected Result: 200 with { token, user }
    Evidence: .sisyphus/evidence/task-6-auth-login.json

  Scenario: Unauthenticated POST blocked
    Tool: Bash
    Steps: curl -X POST http://localhost:3000/api/articles -d '{"title":"test"}' -w "%{http_code}"
    Expected Result: 401
    Evidence: .sisyphus/evidence/task-6-auth-blocked.txt

  Scenario: GET allowed without auth
    Tool: Bash
    Steps: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/articles
    Expected Result: 200 (not 401)
    Evidence: .sisyphus/evidence/task-6-auth-get-allowed.txt
  ```

  **Commit**: YES — `feat(layer): add JWT auth with RBAC`

- [ ] 7. NuxtHub Blob media utilities + upload API

  **What to do**:
  - Configure NuxtHub Blob: `hub: { blob: true }` in nuxt.config.ts (may already be set in T1)
  - **Use NuxtHub v0.10 Blob API**: `import { blob, ensureBlob } from 'hub:blob'` (NOT `hubBlob()`)
  - Create `server/utils/media.ts`:
    - `uploadMedia(file)` — Uses `ensureBlob(file, { maxSize: '5MB', types: ['image'] })` for BUILT-IN validation (H10), then `blob.put(pathname, file, { addRandomSuffix: true, prefix: 'uploads/' })` + create DB record in blobs table
    - `getMediaUrl(pathname)` — Returns `/images/${pathname}` (served via blob.serve route in T14)
    - `deleteMedia(pathname)` — `blob.del(pathname)` + delete DB record
    - `listMedia(options)` — `blob.list({ prefix, limit, cursor })` with metadata from DB
  - Create `server/api/media/index.get.ts` — List media (paginated)
    - Create `server/api/media/index.post.ts` — Upload (auth required, uses `ensureBlob()` for validation)
    - Create `server/api/media/[pathname].get.ts` — Get metadata via `blob.head(pathname)`
    - Create `server/api/media/[pathname].delete.ts` — Delete (auth required)
    - TDD: Tests for media utilities

  **Must NOT do**:
  - Build media management UI
  - Process images (resize/optimize) — just store originals

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`nuxthub`]
  - **Blocks**: T14 (adapter needs media URLs) | **Blocked By**: T1

  - NuxtHub v0.10 Blob: https://hub.nuxt.com/docs/blob
    - NuxtHub Blob SDK: https://hub.nuxt.com/docs/blob/usage
    - ensureBlob() provides built-in MIME + size validation

  **Acceptance Criteria**:
  - [ ] Upload creates Blob + DB record with metadata
    - [ ] Uses `ensureBlob()` for built-in MIME + size validation (rejects non-image and SVG/HTML)
    - [ ] Upload validates file size (rejects >5MB)
    - [ ] List returns paginated media
    - [ ] Delete removes from both Blob and DB
    - [ ] Media URL format works with cooking-blog's image provider

  **QA Scenarios:**
  ```
  Scenario: Upload and retrieve media
    Tool: Bash
    Steps:
      1. curl -X POST http://localhost:3000/api/media -H "Authorization: Bearer $TOKEN" -F 'file=@test-image.png'
      2. curl http://localhost:3000/api/media/1
    Expected Result: Upload 201, retrieve returns metadata
    Evidence: .sisyphus/evidence/task-7-media-upload.json
  ```

  **Commit**: YES — `feat(layer): add media upload API + Blob utilities`

- [ ] 8. Articles CRUD API (with locale filtering)

  **What to do**:
  - Create `server/api/articles/index.get.ts` — List with filters (status, category, locale, slug), populate (cover, category, seo via `?include=`), pagination, sorting
  - Create `server/api/articles/index.post.ts` — Create (auth required, Zod validation)
  - Create `server/api/articles/[id].get.ts` — Get single with relations
  - Create `server/api/articles/[id].put.ts` — Update (auth required)
  - Create `server/api/articles/[id].delete.ts` — Delete (auth required)
  - Create `server/utils/queries/articles.ts` — Reusable Drizzle query builder:
    - Uses `import { db, tables } from 'hub:db'` (NuxtHub v0.10 auto-imported Drizzle instance)
    - `findArticles({ filters, include, sort, page, pageSize, locale, isAuthenticated })`
    - Uses `buildWithObject(include, ['cover', 'category', 'seo'])` from T5 (H2/H3)
    - `include: '*'` expands to `{ cover: true, category: true, seo: true }` via the relation map
    - **DRAFT PROTECTION (H7)**: If `!isAuthenticated`, auto-append `WHERE status = 'published' AND deleted_at IS NULL` — NEVER expose drafts/scheduled/soft-deleted to public
    - Locale fallback: if no results for requested locale, retry with default locale
  - Implement `firstPublishedAt` auto-set on first publish (status changes to published)
  - Auto-generate slug from title via `slugifyUnique()` from T5 (handles collisions)
  - Support `?locale=fr` filtering on all queries — if not found, fall back to default locale
  - TDD: Tests for all CRUD + locale filtering + populate variants

  **Must NOT do**:
  - Build admin UI or Strapi-compatible format (that's T14)
  - Handle scheduled publishing (that's T13)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`drizzle-orm`, `nuxthub`]
  - **Blocks**: T13, T14 | **Blocked By**: T3, T5

  **References**:
  - `cooking-admin/src/api/article/content-types/article/lifecycles.ts` — firstPublishedAt hook logic
  - `cooking-blog/app/pages/index.vue` — Homepage query: `populate: "*"`, `sort: ["publishedAt:desc"]`, `pagination: { page: 1, pageSize: 5 }`
  - `cooking-blog/app/pages/blog/[category]/[slug].vue` — Article detail: filter by slug + category.slug
  - `cooking-blog/server/api/__sitemap__/urls.ts` — Sitemap: `populate=category`, pageSize 100

  **Acceptance Criteria**:
  - [ ] GET /api/articles returns paginated list with populate support
    - [ ] **Unauthenticated GET only returns `status='published' AND deleted_at IS NULL`** (H7 draft protection)
    - [ ] Authenticated GET (with valid JWT) returns drafts too
    - [ ] GET /api/articles?slug=test&include=category returns filtered article with category
    - [ ] GET /api/articles?include=* returns ALL relations populated
    - [ ] GET /api/articles?locale=fr returns only French articles
    - [ ] POST creates article with auto-slug (auth required)
    - [ ] PUT publishes article and sets firstPublishedAt on first publish
    - [ ] DELETE soft-deletes article (sets deleted_at, auth required)
    - [ ] All write endpoints validate input via Zod

  **QA Scenarios:**
  ```
  Scenario: Create and retrieve article
    Tool: Bash
    Steps:
      1. POST /api/articles { title: "Test Article", content: "Hello", category_id: 1 } with auth
      2. GET /api/articles?include=category
    Expected Result: Article created with slug, category populated
    Evidence: .sisyphus/evidence/task-8-article-crud.json

  Scenario: Publish sets firstPublishedAt
    Tool: Bash
    Steps:
      1. PUT /api/articles/1 { status: 'published' }
      2. GET /api/articles/1
    Expected Result: firstPublishedAt and publishedAt both set
    Evidence: .sisyphus/evidence/task-8-article-publish.json

  Scenario: Locale filtering works
    Tool: Bash
    Steps:
      1. Insert articles with locale='fr' and locale='en'
      2. GET /api/articles?locale=fr
    Expected Result: Only French articles returned
    Evidence: .sisyphus/evidence/task-8-article-locale.json

  Scenario: Populate wildcard works
    Tool: Bash
    Steps: GET /api/articles?include=*
    Expected Result: Each article has cover, category, seo populated
    Evidence: .sisyphus/evidence/task-8-article-populate-star.json
  ```

  **Commit**: YES — `feat(layer): add Articles CRUD API with locale filtering`

- [ ] 9. Recipes CRUD API (with locale filtering)

  **What to do**:
  - Full CRUD at `server/api/recipes/` (same pattern as T8)
  - Create `server/utils/queries/recipes.ts` — Query builder:
    - `findRecipes({ filters, include, sort, page, pageSize, locale, isAuthenticated })`
    - Uses `buildWithObject(include, ['cover', 'category', 'nutrition', 'ingredients', 'reviews', 'seo'])` from T5
    - `include: '*'` expands to all recipe relations
    - **DRAFT PROTECTION (H7)**: Same as articles — unauthenticated GET auto-filters `status='published' AND deleted_at IS NULL`
  - Handle nested create/update: ingredients array (insert/update/delete diff), nutrition (upsert), reviews (append), seo (upsert)
  - Auto-generate slug, firstPublishedAt on publish
  - Locale filtering on all queries with fallback
  - TDD: Tests for CRUD + nested data + locale

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T13, T14 | **Blocked By**: T3, T4, T5

  **References**:
  - `cooking-admin/src/api/recipe/content-types/recipe/schema.json` — All recipe fields
  - `cooking-blog/app/pages/recette/[slug].vue` — Recipe consumption: filter by slug, populate cover/category/nutrition/ingredients/seo
  - `cooking-blog/app/pages/index.vue` — Homepage: `populate: "*"`, pageSize 4

  **Acceptance Criteria**:
  - [ ] Full CRUD with nested ingredients, nutrition, reviews, SEO
    - [ ] **Unauthenticated GET only returns published content** (H7)
    - [ ] GET /api/recipes?include=ingredients,nutrition,seo returns all nested data
    - [ ] GET /api/recipes?include=* returns ALL relations
    - [ ] GET /api/recipes?locale=fr filters by locale
    - [ ] POST creates recipe with nested ingredients in single request

  **QA Scenarios:**
  ```
  Scenario: Create recipe with ingredients
    Tool: Bash
    Steps: POST /api/recipes { title: "Soupe", ingredients: [{name:"Carotte",qty:2,unit:"g"}], difficulty:"easy",time:30 } with auth
    Expected Result: Recipe created with nested ingredients
    Evidence: .sisyphus/evidence/task-9-recipe-crud.json

  Scenario: Locale filtering on recipes
    Tool: Bash
    Steps:
      1. Insert recipes with locale='fr' and locale='en'
      2. GET /api/recipes?locale=en
    Expected Result: Only English recipes returned
    Evidence: .sisyphus/evidence/task-9-recipe-locale.json

  Scenario: Populate wildcard returns all nested data
    Tool: Bash
    Steps: GET /api/recipes?include=*
    Expected Result: Each recipe has ingredients, nutrition, reviews, seo, category, cover populated
    Evidence: .sisyphus/evidence/task-9-recipe-populate-star.json
  ```

  **Commit**: YES — `feat(layer): add Recipes CRUD API with locale filtering`

- [ ] 10. Categories CRUD API — both types (with locale filtering)

  **What to do**:
  - CRUD at `server/api/categories/` for recipe categories
    - CRUD at `server/api/category-articles/` for article categories
    - Both: list, get, create, update, delete with slug auto-generation via `slugifyUnique()`
    - **DRAFT PROTECTION (H7)**: Unauthenticated GET auto-filters `status='published' AND deleted_at IS NULL`
    - Categories include related recipes count; CategoryArticles include articles count
    - Locale filtering with fallback
    - TDD: Tests for both category types + locale

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T13, T14 | **Blocked By**: T3, T5

  **References**:
  - `cooking-admin/src/api/category/content-types/category/schema.json`
  - `cooking-admin/src/api/category-article/content-types/category-article/schema.json`

  **Acceptance Criteria**:
  - [ ] Both category types have full CRUD
  - [ ] Related content counts returned (recipes count, articles count)
  - [ ] Locale filtering works on both
  - [ ] Slug auto-generated from name

  **QA Scenarios:**
  ```
  Scenario: Create category and verify slug
    Tool: Bash
    Steps: POST /api/categories { name: "Desserts", desc: "Recettes de desserts" } with auth
    Expected Result: Category created with slug "desserts"
    Evidence: .sisyphus/evidence/task-10-category-crud.json

  Scenario: Category includes recipe count
    Tool: Bash
    Steps:
      1. Create category, create 2 recipes with that category
      2. GET /api/categories?include=recipes
    Expected Result: Category has recipeCount: 2
    Evidence: .sisyphus/evidence/task-10-category-count.json

  Scenario: Locale filtering on categories
    Tool: Bash
    Steps: GET /api/categories?locale=fr
    Expected Result: Only French categories returned
    Evidence: .sisyphus/evidence/task-10-category-locale.json
  ```

  **Commit**: YES — `feat(layer): add Categories CRUD API with locale filtering`

- [ ] 11. Pages CRUD API (with locale filtering)

  **What to do**:
  - CRUD at `server/api/pages/`
    - Handle self-referencing parent relation (page → parent page)
    - **DEEP PARENT POPULATION (H13)**: Support nested `with: { parent: { with: { parent: { with: { parent: true } } } } }` up to 3 levels for `generateSlug` recursion
    - **CIRCULAR REFERENCE DETECTION**: On PUT, walk up the parent chain to ensure setting `parent_id` doesn't create a cycle (A→B→A)
    - Content stored as MDC markdown text
    - Support nested page URLs from parent hierarchy (use `generateNestedSlug` from T5)
    - Create `server/utils/queries/pages.ts` — Query builder with parent join + seoMeta
    - **DRAFT PROTECTION (H7)**: Unauthenticated GET auto-filters `status='published' AND deleted_at IS NULL`
    - Locale filtering with fallback
    - TDD: Tests for CRUD + parent hierarchy + locale + circular detection

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T13, T14 | **Blocked By**: T3, T5

  **References**:
  - `cooking-admin/src/api/page/content-types/page/schema.json` — Page schema
  - `cooking-blog/app/pages/[...slug].vue` — Page consumption: filter by slug + parent.slug, populate content/seoMeta/parent
  - `cooking-blog/app/utils/format.ts` — generateSlug for nested page URLs
  - `cooking-blog/server/api/__sitemap__/urls.ts` — Page sitemap: `populate[parent][populate][0]=parent`

  **Acceptance Criteria**:
  - [ ] Full CRUD with parent hierarchy
    - [ ] **Deep parent population (3 levels) works for generateSlug** (H13)
    - [ ] **Circular parent references rejected on PUT** (returns 400 VALIDATION_ERROR)
    - [ ] **Unauthenticated GET only returns published content** (H7)
    - [ ] Content stored/retrieved as MDC text
    - [ ] Parent page populated when requested
    - [ ] Locale filtering works
    - [ ] Slug generation handles parent hierarchy

  **QA Scenarios:**
  ```
  Scenario: Create page with parent
    Tool: Bash
    Steps:
      1. POST /api/pages { name: "About", title: "About Us", content: "# Hello" } with auth → creates page ID 1
      2. POST /api/pages { name: "Team", title: "Our Team", content: "# Team", parent_id: 1 } with auth
      3. GET /api/pages?slug=team&include=parent
    Expected Result: Page 2 has parent populated with page 1 data
    Evidence: .sisyphus/evidence/task-11-page-parent.json

  Scenario: Locale filtering on pages
    Tool: Bash
    Steps: GET /api/pages?locale=fr
    Expected Result: Only French pages returned
    Evidence: .sisyphus/evidence/task-11-page-locale.json

  Scenario: Page content is MDC markdown
    Tool: Bash
    Steps:
      1. POST /api/pages { name: "Test", title: "Test", content: "## Heading\n\nSome **bold** text" }
      2. GET /api/pages/1
    Expected Result: content field contains raw MDC markdown string
    Evidence: .sisyphus/evidence/task-11-page-mdc.json
  ```

  **Commit**: YES — `feat(layer): add Pages CRUD API with locale filtering`

- [ ] 12. SEO meta API

  **What to do**:
  - Create `server/api/seo/[contentType]/[contentId].get.ts` — Get SEO data for content
  - Create `server/api/seo/[contentType]/[contentId].put.ts` — Update SEO data (auth required, Zod validation)
  - Handle social_meta nested within SEO records
  - Reusable in article/recipe/page API responses via `?include=seo`
  - TDD: Tests for SEO CRUD

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high` | **Skills**: [`drizzle-orm`]
  - **Blocks**: T14 | **Blocked By**: T3, T4, T5

  **References**:
  - `cooking-admin/src/components/shared/seo.json` — SEO fields: metaSocial, metaRobots, description, keywords
  - `cooking-admin/src/components/shared/meta-social.json` — Social: socialNetwork, title, description, image

  **Acceptance Criteria**:
  - [ ] SEO data retrieved with content when populated via `?include=seo`
  - [ ] SEO data updatable independently
  - [ ] Social meta stored and retrieved (Facebook/Twitter cards)
  - [ ] Input validated via Zod

  **QA Scenarios:**
  ```
  Scenario: Get SEO data for article
    Tool: Bash
    Steps:
      1. Insert SEO record for article ID 1
      2. GET /api/seo/article/1
    Expected Result: Returns SEO with description, keywords, metaRobots, social_meta array
    Evidence: .sisyphus/evidence/task-12-seo-get.json

  Scenario: Update SEO data
    Tool: Bash
    Steps: PUT /api/seo/article/1 { description: "New description", keywords: "recipe,food" } with auth
    Expected Result: 200 with updated SEO data
    Evidence: .sisyphus/evidence/task-12-seo-update.json

  Scenario: SEO populated via include
    Tool: Bash
    Steps: GET /api/articles?include=seo
    Expected Result: Each article has seo object with all fields
    Evidence: .sisyphus/evidence/task-12-seo-include.json
  ```

  **Commit**: YES — `feat(layer): add SEO meta API`

- [ ] 13. Publishing workflow API + CRON (all content types)

  **What to do**:
  - Create `server/api/publish/[contentType]/[id].post.ts` — Publish (status=published, publishedAt=now, firstPublishedAt if not set)
  - Create `server/api/unpublish/[contentType]/[id].post.ts` — Unpublish (status=draft)
  - Create `server/api/schedule/[contentType]/[id].post.ts` — Schedule for future date (status=scheduled, scheduled_at=date)
  - Create `server/tasks/scheduled-publish.ts` — NuxtHub CRON task:
    ```ts
    export default defineTask('scheduled-publish', () => {
      // Query ALL content types where scheduled_at <= now AND status = 'scheduled'
      // Publish each: set status=published, publishedAt=now, firstPublishedAt if not set
    })
    ```
  - Configure CRON in nuxt.config.ts: `nitro: { scheduledTasks: { '*/5 * * * *': 'scheduled-publish' } }` — Nitro auto-generates Cloudflare Cron Triggers at build time (no manual wrangler config needed)
  - Support ALL content types: articles, recipes, categories, category_articles, pages
  - TDD: Tests for publish/unpublish/schedule + CRON handler

  **Must NOT do**:
  - Hardcode only articles — must work for ALL content types via `contentType` parameter
  - Use Node.js timers — use NuxtHub CRON

  **Recommended Agent Profile**:
  - **Category**: `deep` | **Skills**: [`nuxthub`]
  - **Blocked By**: T8, T9, T10, T11 (ALL CRUD APIs must exist)

  **References**:
  - `cooking-admin/config/plugins.ts` — Current publisher plugin hooks
  - NuxtHub Background Tasks: https://hub.nuxt.com/docs/features/background-tasks

  **Acceptance Criteria**:
  - [ ] Publish sets status, publishedAt, firstPublishedAt (on first publish only)
  - [ ] Unpublish reverts to draft
  - [ ] Schedule sets future date and status=scheduled
  - [ ] CRON publishes due items across ALL content types
  - [ ] Works for articles, recipes, categories, category_articles, pages

  **QA Scenarios:**
  ```
  Scenario: Publish article
    Tool: Bash
    Steps:
      1. Create article (status=draft)
      2. POST /api/publish/articles/1 with auth
      3. GET /api/articles/1
    Expected Result: status=published, publishedAt set, firstPublishedAt set
    Evidence: .sisyphus/evidence/task-13-publish-article.json

  Scenario: Scheduled publish via CRON
    Tool: Bash
    Steps:
      1. Create article, schedule for 1 minute ago via POST /api/schedule/articles/1 { date: "2024-01-01T00:00:00Z" }
      2. Trigger scheduled-publish task manually
      3. GET /api/articles/1
    Expected Result: status = published
    Evidence: .sisyphus/evidence/task-13-scheduled-publish.json

  Scenario: Publish works for recipes
    Tool: Bash
    Steps:
      1. Create recipe (status=draft)
      2. POST /api/publish/recipes/1 with auth
      3. GET /api/recipes/1
    Expected Result: status=published, firstPublishedAt set
    Evidence: .sisyphus/evidence/task-13-publish-recipe.json

  Scenario: Unpublish
    Tool: Bash
    Steps:
      1. POST /api/unpublish/articles/1 with auth
      2. GET /api/articles/1
    Expected Result: status=draft, publishedAt still set (history preserved), firstPublishedAt preserved
    Evidence: .sisyphus/evidence/task-13-unpublish.json
  ```

  **Commit**: YES — `feat(layer): add publishing workflow with CRON for all content types`

- [ ] 14. Strapi adapter + Comark migration for apps/web

  **What to do** (extends original T14):
  - `apps/web/app/composables/useStrapi.ts` — adapter calls `cmsBaseUrl/api/*` (not layer merge)
  - `apps/web/app/composables/useCmsApi.ts` — typed clean API client
  - Remove `@nuxtjs/strapi`, `@nuxt-alt/proxy`, `@nuxtjs/mdc` from web
  - Add `@comark/nuxt` — replace `<MDC>` with `<Comark>` on:
    - `apps/web/app/pages/blog/[category]/[slug].vue`
    - `apps/web/app/pages/recette/[slug].vue` (intro + step markdown)
    - `apps/web/app/pages/[...slug].vue` (CMS pages)
    - `apps/web/app/components/preview/*`
  - Migrate `app/components/prose/Prose*.vue` → Comark prose overrides (or delete if Comark defaults suffice)
  - Remove `BaseContentDisplay` dynamic-zone renderer after pages use Comark markdown
  - Update sitemap/RSS to CMS API with sparse fieldsets
  - R2 media: `server/routes/images/[...pathname].get.ts` on CMS; web `useFormatCover` → `/images/...`
  - Legacy `/uploads/` rewrite route on CMS Worker

  **Acceptance Criteria**:
  - [ ] Homepage, article, recipe, page render without Strapi
  - [ ] `<Comark>` renders migrated markdown with custom prose components
  - [ ] No `@nuxtjs/mdc` or `admin.journalducuistot.fr` in web app
  - [ ] Adapter supports `populate: "*"` and listing-page filter shapes

  **Commit**: YES — `feat(web): Strapi adapter, Comark rendering, CMS API wiring`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm typecheck` + `pnpm lint` + `pnpm test` in layer-blog-cms. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify layer has NO UI dependencies. Verify Zod validation on all write endpoints. Verify consistent error format.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ Playwright)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cooking-blog renders all content types without Strapi running. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec built, nothing beyond spec. Check "Must NOT do" compliance. Flag unaccounted changes. Verify locale filtering baked into ALL CRUD APIs (not retrofitted). Verify publishing works for ALL content types.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message |
|------|---------------|
| 0 | `chore: restructure to pnpm monorepo (apps/web + apps/cms + packages/db)` |
| 0 | `feat(infra): add Alchemy v2 stack (D1, R2, KV, Cron)` |
| 0 | `feat(cms): add Strapi extract pipeline with per-entity services` |
| 1 | `feat(cms): scaffold foundation — Drizzle schemas + shared utils` |
| 2 | `feat(cms): add CRUD API for all content types + auth + media + publishing` |
| 3 | `feat(web): Strapi adapter, Comark rendering, CMS API wiring` |
| FINAL | `chore: verification and cleanup` |

---

## Success Criteria

### Verification Commands
```bash
# Monorepo install
pnpm install                              # sync lockfile first

# Unit tests
pnpm --filter cms test                    # CMS unit tests
pnpm --filter web test                    # Web unit tests (when added)

# Alchemy (confirm with team before deploy)
alchemy login                             # once per machine
alchemy deploy                            # provisions D1 + R2 + KV

# CMS API health (cms on :3001)
curl http://localhost:3001/api/health     # Expected: { status: 'ok' } + DB ping
curl http://localhost:3001/api/articles # Expected: JSON with articles

# Strapi extract (staging)
pnpm --filter cms exec nuxt task run strapi-extract

# Web renders without Strapi (web on :3000)
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/rss.xml

# No hardcoded Strapi URLs in web
grep -r "admin.journalducuistot.fr" apps/web/ --include="*.ts" --include="*.vue"
# Expected: no matches

# No NuxtHub remnants
grep -r "hub:db\|@nuxthub/core\|hub:blob" apps/ packages/
# Expected: no matches
```

### Final Checklist
- [ ] Monorepo: `apps/web`, `apps/cms`, `packages/db`
- [ ] Alchemy v2 stack deploys D1 + R2 + KV ([v2 docs](https://v2.alchemy.run/))
- [ ] No NuxtHub (`@nuxthub/core`, `hub:*`) anywhere
- [ ] Strapi extract pipeline idempotent with `legacy_strapi_map`
- [ ] All CMS content in D1 (NOT Nuxt Content)
- [ ] Comark (`@comark/nuxt`) replaces `@nuxtjs/mdc` on web
- [ ] Locale filtering on ALL CMS APIs
- [ ] `apps/web` renders without Strapi
- [ ] Scheduled publishing via Alchemy Cron + Nitro `defineTask`
- [ ] `populate: "*"` supported in adapter
- [ ] Draft protection on unauthenticated GET
- [ ] Sitemap/RSS use CMS API with sparse fieldsets
- [ ] Media served from R2 via `/images/` + legacy `/uploads/` rewrite
- [ ] JWT 1h expiration, `JWT_SECRET` from env
- [ ] PBKDF2 password hashing (not scrypt)
- [ ] SEO nullable FKs (not polymorphic)
- [ ] `UNIQUE(slug, locale)` on all content tables
- [ ] `useStrapi.ts` adapter (not `useStrapiAdapter.ts`)
- [ ] `password_hash` never in API responses
- [ ] Soft deletes (`deleted_at`) on all content
