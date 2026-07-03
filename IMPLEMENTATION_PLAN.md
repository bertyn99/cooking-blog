# Strapi → Nuxt CMS Layer (Backend Focus)

## TL;DR

> **Quick Summary**: Build the backend foundation of `cooking-blog/layers/layer-blog-cms/` — a lean API-only Nuxt layer with Drizzle ORM schemas replicating all Strapi content types, a clean CRUD API with i18n baked in, and a Strapi-compatible adapter. Admin UI and data migration are deferred.
> 
> **Deliverables**:
> - Lean Nuxt layer (API-only, no UI deps) with Drizzle ORM schemas for all 5 Strapi content types + components
> - Full CRUD API (Nitro server routes) for articles, recipes, categories, pages — with locale filtering built in
> - Shared utilities (pagination, populate resolver, validation, error format, slug generation)
> - Publishing workflow (draft/publish/scheduled) via NuxtHub CRON
> - Media upload/management API via NuxtHub Blob
> - Basic API auth (JWT + RBAC) for write operations
> - Strapi-compatible adapter in cooking-blog (supports `populate: "*"`)
> 
> **Estimated Effort**: Large (14 implementation tasks + 4 verification)
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: T1 → T2 → T3 → T5 → T8 → T13 → T14 → F1-F4

---

## Context

### Original Request
Migrate from Strapi v5 CMS to a custom Nuxt layer. Focus first on building the layer backend (database schemas + API) and the Strapi compatibility adapter. Admin UI and data migration come in a separate plan.

### Interview Summary
- **Motivation**: Simplify stack — one unified Nuxt codebase
- **Nuxt version**: Both layer and cooking-blog use Nuxt 4 (^4.4.5 via pnpm catalog) — ALREADY DONE
- **Database**: Cloudflare D1 (SQLite) via NuxtHub
- **Media Storage**: NuxtHub Blob
- **Page Content**: MDC (Markdown + Vue components) instead of Strapi dynamic zones
- **Auth**: Multi-user with roles (for future admin UI — API auth only for now)
- **API Design**: Clean new API + Strapi-compatibility adapter in cooking-blog
- **Testing**: TDD with Vitest
- **i18n**: Baked into schemas and CRUD APIs from the start (separate DB rows per locale linked by `locale_group_id`)

### Current State (Verified)
- **pnpm workspace**: Set up at `cooking-blog/` level with catalog resolving `nuxt: '^4.4.5'` ✓
- **Nuxt 4 upgrade**: cooking-blog already on Nuxt 4 (no `future: { compatibilityVersion: 4 }`) ✓
- **Layer state**: Still has full Nuxt UI starter template (app.vue, AppLogo, TemplateMenu, index.vue) — needs cleanup
- **Layer deps**: Heavy — has @nuxt/ui, @pinia/nuxt, @nuxtjs/i18n, tailwindcss, @nuxt/image. Most unnecessary for API-only layer.
- **No `server/` directory**: Does not exist yet in the layer
- **Test infrastructure**: Vitest configured with unit/nuxt/e2e projects ✓
- **NuxtHub version**: @nuxthub/core 0.10.7 — uses v0.10 API (`hub: { db: 'sqlite' }`, `hub:db` virtual module, `nuxt db generate`). NOT v0.9 API (`hubDatabase()`, `database: true`)
- **Nuxt 5 target**: Both layer and cooking-blog use `future: { compatibilityVersion: 5 }` on Nuxt 4.4.x for early Nuxt 5 opt-in (Vite Environment API, Nitro v3, normalized page names). Nuxt 5 is NOT released yet — this is the officially supported testing path.
- **Nuxt SEO**: cooking-blog currently has `@nuxtjs/seo: ^3.0.3` — needs upgrade to v5 (latest). Sitemap at v8, OG Image at v6, Schema.org at v6.
- **Nitro v3 tasks**: `defineTask()` requires `nitro: { experimental: { tasks: true } }`. Scheduled tasks auto-generate Cloudflare Cron Triggers.

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
Build the layer-blog-cms backend: lean API-only layer, Drizzle schemas with i18n, shared utilities, CRUD API with locale filtering, publishing workflow, media handling, auth — and wire cooking-blog to consume it via a Strapi-compatible adapter.

### Concrete Deliverables
- `cooking-blog/layers/layer-blog-cms/server/` — Drizzle schemas, API routes, auth, media, CRON, shared utils
- `cooking-blog/layers/layer-blog-cms/server/utils/` — DB connection, query builders, auth, validation, pagination
- `cooking-blog/app/composables/useCmsApi.ts` — Clean API client
- `cooking-blog/app/composables/useStrapiAdapter.ts` — Strapi-compatible wrapper (supports `populate: "*"`)
- Updated `cooking-blog/nuxt.config.ts` — Remove Strapi, add layer extends

### Definition of Done
- [ ] All 5 content types have Drizzle schemas in D1 with locale fields
- [ ] All CRUD API routes work (list, get, create, update, delete) with `?locale=` support
- [ ] Draft/publish/scheduled workflow functional for ALL content types
- [ ] cooking-blog renders content WITHOUT Strapi running
- [ ] `pnpm test` passes in layer-blog-cms
- [ ] Layer has NO unnecessary UI dependencies

### Must Have
- Drizzle ORM schemas for all 5 content types + components (with locale fields from start)
- Shared API utilities: pagination, populate resolver, Zod validation, error format, slug generation
- CRUD API for every content type with populate/relation support AND locale filtering
- Draft/publish workflow with `firstPublishedAt` tracking
- Scheduled publishing via NuxtHub CRON
- Basic JWT auth for write operations
- Media upload to NuxtHub Blob
- SEO meta fields on all content types
- i18n locale support with `locale_group_id` linking (baked into CRUD, not retrofitted)
- Strapi-compatible adapter in cooking-blog (supports `populate: "*"`)
- TDD: tests written before implementation
- Consistent JSON error format: `{ error: { code: string, message: string, details?: any } }`
- Input validation via Zod on all write endpoints

### Must NOT Have (Guardrails)
- **NO admin UI** — deferred to next plan
- **NO data migration** — deferred to next plan
- **NO generic CMS** — hardcode Article, Recipe, Page, Category, CategoryArticle only
- **NO generic Strapi emulator** — adapter supports ONLY exact queries cooking-blog uses
- **NO complex WYSIWYG** — content stored as text/markdown, editors come later
- **NO UI dependencies in layer** — no @nuxt/ui, no tailwindcss, no pinia, no @nuxt/image (these belong in cooking-blog)
- **NO `as any` / `@ts-ignore`** — type safety is non-negotiable
- **NO OAuth/social login** — JWT only
- **NO Strapi password migration** — fresh auth system
- **AI slop prevention**: No excessive JSDoc, no over-abstraction, no generic names, no unnecessary utilities

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
Wave 1 (Foundation — 5 tasks):
├── T1: Clean starter, strip UI deps, create server/ skeleton [quick]
├── T2: Drizzle ORM + D1 database setup [quick]
├── T3: Database schema: core content types (with locale) [quick]
├── T4: Database schema: component/embedded types [quick]
└── T5: Shared API utilities (pagination, populate, validation, errors, slug) [quick]

Wave 2 (Core API — 7 tasks, max parallel):
├── T6: Auth (JWT + RBAC for API) (depends: T3, T5) [deep]
├── T7: NuxtHub Blob media utilities + upload API (depends: T1) [unspecified-high]
├── T8: Articles CRUD API + locale (depends: T3, T5) [unspecified-high]
├── T9: Recipes CRUD API + locale (depends: T3, T4, T5) [unspecified-high]
├── T10: Categories CRUD API + locale (depends: T3, T5) [unspecified-high]
├── T11: Pages CRUD API + locale (depends: T3, T5) [unspecified-high]
└── T12: SEO meta API (depends: T3, T4, T5) [unspecified-high]

Wave 3 (Integration — 2 tasks):
├── T13: Publishing workflow API + CRON (depends: T8-T11 all CRUD) [deep]
└── T14: Strapi adapter for cooking-blog (depends: T8-T12) [deep]

Wave FINAL (4 parallel reviews → user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T2 → T3 → T5 → T8 → T13 → T14 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 7 (Wave 2)
```

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

- [ ] 14. Strapi adapter for cooking-blog

  **What to do**:
  - Create `cooking-blog/app/composables/useCmsApi.ts` — Clean API client for the layer:
    - `$apiGet(path, params)` / `$apiPost(path, body)` / `$apiPut(path, body)` / `$apiDelete(path)`
    - Typed responses matching layer API shapes
  - **Create `cooking-blog/app/composables/useStrapi.ts`** (H4: NOT `useStrapiAdapter.ts` — Nuxt auto-imports by filename, must match `useStrapi()` to avoid breaking all existing pages). Wraps useCmsApi to provide drop-in replacement:
    ```ts
    // Translates Strapi-style queries to clean API calls:
    // { populate: "*", sort: ["publishedAt:desc"], pagination: { page: 1, pageSize: 5 } }
    // → GET /api/articles?include=*&sort=publishedAt:desc&page=1&pageSize=5
    // Returns: { data: [...], meta: { pagination: {...} } }
    ```
    - **DELETE `cooking-blog/app/plugins/strapi.client.ts`** (no longer needed — the composable replaces it)
    ```ts
    // Translates Strapi-style queries to clean API calls:
    // { populate: "*", sort: ["publishedAt:desc"], pagination: { page: 1, pageSize: 5 } }
    // → GET /api/articles?include=*&sort=publishedAt:desc&page=1&pageSize=5
    // Returns: { data: [...], meta: { pagination: {...} } }
    ```
  - Support ONLY these exact query shapes (from cooking-blog, verified):
    - Articles: `populate: "*"`, sort publishedAt:desc, pagination → wildcard include
    - Articles: filter by slug + category.slug, populate specific fields → filtered include
    - Recipes: `populate: "*"`, sort publishedAt:desc, pagination → wildcard include
    - Recipes: filter by slug, populate cover/category/nutrition/ingredients/seo → specific include
    - Pages: filter by slug + parent.slug, populate content/seoMeta/parent → nested include
    - Sitemap/RSS: direct $fetch with populate params → translate to layer API
  - Return data in Strapi's `{ data: [...], meta: { pagination } }` format
  - Support `populate: "*"` (wildcard) — maps to `include=*`
  - **SITEMAP/RSS STATUS FILTERING (H8)**: Adapter must auto-pass `status=published` for all sitemap/RSS queries — never expose drafts to search engines
  - **SPARSE FIELDSETS FOR SITEMAP (H11)**: Sitemap/RSS queries should request only `?fields=slug,updated_at` — NOT full populate, to avoid OOM from loading 100 full MDC articles into Worker memory
  - Update `cooking-blog/nuxt.config.ts`:
    - Remove `@nuxtjs/strapi` module
    - Remove `@nuxt-alt/proxy` module + proxy config for `/uploads/`
    - Remove strapi config section
    - Remove strapi runtime config
    - Add `extends: ['layers/layer-blog-cms']`
    - **Add Nuxt 5 compat**: `future: { compatibilityVersion: 5 }` (matches layer config)
    - **Upgrade @nuxtjs/seo from v3 to v5**: `pnpm add @nuxtjs/seo@latest` — breaking changes include OG Image v6 (components removed, use `defineOgImageComponent()`), Sitemap v8, Schema.org v6. Verify sitemap `sources` and `defineSitemapEventHandler` API still works.
    - **Enable Nitro tasks**: `nitro: { experimental: { tasks: true } }` (for scheduled publishing CRON in T13)
    - **BLOB SERVING ROUTE**: Create `server/routes/images/[...pathname].get.ts` in the LAYER that uses `import { blob } from 'hub:blob'` + `blob.serve(event, pathname)` — this serves all media via `/images/{pathname}` URL pattern (NuxtHub v0.10 pattern for Nuxt Image integration)
    - **LEGACY URL REWRITE (H12)**: Create `server/routes/uploads/[...filename].get.ts` in the LAYER that maps old `/uploads/{filename}` → `blob.serve(event, filename)` (existing MDC content has hardcoded Strapi URLs that would otherwise 404)
  - ~~Update `cooking-blog/app/plugins/strapi.client.ts`~~ → **DELETE it** (useStrapi.ts composable replaces it)
  - Update `cooking-blog/server/api/__sitemap__/urls.ts` — replace hardcoded `admin.journalducuistot.fr` URLs with layer API calls. **Use sparse fieldsets** (`?fields=slug,updated_at&status=published`)
    - Update `cooking-blog/server/routes/rss.xml.ts` — replace hardcoded Strapi URLs. **Use sparse fieldsets** + `status=published`
    - Update `cooking-blog/app/composables/useFormatCover.ts` — update cover URL formatting: Strapi returns `{ url: '/uploads/image.jpg' }`, new API returns `{ pathname: 'uploads/image.jpg' }`. Cover URL should be `/images/uploads/image.jpg` (served via blob.serve route).
  - TDD: Tests verifying adapter returns Strapi-compatible data for each query shape

  **Must NOT do**:
  - Build a generic Strapi query parser — only support the exact shapes listed above
  - Remove cooking-blog's existing component structure
  - Break any existing page rendering

  **Recommended Agent Profile**:
  - **Category**: `deep` | **Skills**: [`nuxt`, `vue-best-practices`]
  - **Blocked By**: T7-T12 (all APIs must exist)

  **References**:
  - `cooking-blog/app/pages/index.vue` — Homepage: `populate: "*"`, sort publishedAt:desc, pageSize 5/4
  - `cooking-blog/app/pages/blog/[category]/[slug].vue` — Article: filter slug + category.slug, populate specific
  - `cooking-blog/app/pages/recette/[slug].vue` — Recipe: filter slug, populate specific
  - `cooking-blog/app/pages/[...slug].vue` — Page: filter slug + parent.slug, populate nested
  - `cooking-blog/server/api/__sitemap__/urls.ts` — 3 $fetch calls to admin.journalducuistot.fr
  - `cooking-blog/server/routes/rss.xml.ts` — 3 $fetch calls to admin.journalducuistot.fr
  - `cooking-blog/nuxt.config.ts` lines 29 (strapi module), 125-143 (proxy + strapi config)
  - `cooking-blog/app/types/strapiMeta.d.ts` — TypeScript types
  - `cooking-blog/app/composables/useFormatCover.ts` — Cover image formatting

  **Acceptance Criteria**:
  - [ ] Adapter provides `find()` compatible with `useStrapi()` — **file named `useStrapi.ts` not `useStrapiAdapter.ts`** (H4)
    - [ ] Adapter supports `populate: "*"` (wildcard)
    - [ ] Adapter returns Strapi-compatible `{ data, meta: { pagination } }` shape
    - [ ] **Sitemap/RSS queries pass `status=published` and use sparse fieldsets** (H8, H11)
    - [ ] **Legacy `/uploads/` URLs rewritten to Blob** (H12)
    - [ ] cooking-blog homepage loads articles and recipes without Strapi
  - [ ] Article page (`/blog/category/slug`) renders without Strapi
  - [ ] Recipe page (`/recette/slug`) renders without Strapi
  - [ ] Pages render without Strapi
  - [ ] Sitemap and RSS feed use new API
  - [ ] `/uploads/` serves from NuxtHub Blob
  - [ ] No hardcoded `admin.journalducuistot.fr` URLs remain

  **QA Scenarios:**
  ```
  Scenario: Article page renders without Strapi
    Tool: Playwright
    Steps:
      1. Ensure Strapi is NOT running
      2. Start cooking-blog with layer API
      3. Navigate to /blog/{category}/{slug}
    Expected Result: Article renders with title, content, cover, category
    Evidence: .sisyphus/evidence/task-14-adapter-article.png

  Scenario: Homepage loads recent content
    Tool: Playwright
    Steps: Navigate to /
    Expected Result: Recent articles and recipes displayed with covers
    Evidence: .sisyphus/evidence/task-14-adapter-homepage.png

  Scenario: Recipe page renders
    Tool: Playwright
    Steps: Navigate to /recette/{slug}
    Expected Result: Recipe renders with ingredients, steps, nutrition, cover
    Evidence: .sisyphus/evidence/task-14-adapter-recipe.png

  Scenario: Sitemap generates from new API
    Tool: Bash
    Steps: curl -s http://localhost:3000/sitemap.xml | head -20
    Expected Result: XML with URLs from new API, no Strapi errors
    Evidence: .sisyphus/evidence/task-14-adapter-sitemap.xml

  Scenario: RSS generates from new API
    Tool: Bash
    Steps: curl -s http://localhost:3000/rss.xml | head -20
    Expected Result: Valid RSS XML, no Strapi errors
    Evidence: .sisyphus/evidence/task-14-adapter-rss.xml

  Scenario: No hardcoded Strapi URLs remain
    Tool: Bash
    Steps: grep -r "admin.journalducuistot.fr" cooking-blog/app/ cooking-blog/server/ --include="*.ts" --include="*.vue" | grep -v node_modules
    Expected Result: No matches (exit code 1)
    Evidence: .sisyphus/evidence/task-14-no-strapi-urls.txt
  ```

  **Commit**: YES — `feat(blog): add Strapi adapter, migrate to layer API`

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
| 1 | `feat(layer): scaffold CMS layer foundation — strip UI deps, Drizzle + D1 + schemas + shared utils` |
| 2 | `feat(layer): add CRUD API for all content types + auth + media + publishing + SEO` |
| 3 | `feat(blog): add Strapi adapter, wire cooking-blog to layer API` |
| FINAL | `chore: verification and cleanup` |

---

## Success Criteria

### Verification Commands
```bash
# Layer tests
cd cooking-blog/layers/layer-blog-cms && pnpm test           # Expected: All tests pass
cd cooking-blog/layers/layer-blog-cms && pnpm typecheck      # Expected: No errors

# Layer has no UI deps
cd cooking-blog/layers/layer-blog-cms && node -e "const p=require('./package.json'); ['@nuxt/ui','@pinia/nuxt','tailwindcss'].forEach(d=>{if(p.dependencies?.[d]||p.devDependencies?.[d]) process.exit(1)})" # Expected: exit 0

# API health
curl http://localhost:3000/api/articles   # Expected: JSON with articles
curl http://localhost:3000/api/recipes    # Expected: JSON with recipes
curl http://localhost:3000/api/pages      # Expected: JSON with pages
curl http://localhost:3000/api/categories # Expected: JSON with categories
curl http://localhost:3000/api/category-articles # Expected: JSON

# Locale filtering
curl http://localhost:3000/api/articles?locale=fr  # Expected: French articles only

# cooking-blog works without Strapi
curl http://localhost:3000/sitemap.xml    # Expected: Valid XML
curl http://localhost:3000/rss.xml        # Expected: Valid RSS

# No hardcoded Strapi URLs
grep -r "admin.journalducuistot.fr" cooking-blog/app/ cooking-blog/server/ --include="*.ts" --include="*.vue" | grep -v node_modules
# Expected: no matches
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Layer has NO UI dependencies (@nuxt/ui, pinia, tailwindcss removed)
- [ ] Locale filtering works on ALL content type APIs
- [ ] cooking-blog renders content without Strapi
- [ ] Scheduled publishing works via CRON for ALL content types
- [ ] All API endpoints respond correctly
- [ ] `populate: "*"` supported in adapter
- [ ] No hardcoded Strapi URLs in cooking-blog
- [ ] Zod validation on all write endpoints
- [ ] Consistent error response format
- [ ] **Drafts NOT exposed via unauthenticated GET** (status='published' auto-filter)
- [ ] **Sitemap/RSS filter status=published** (H8)
- [ ] **Sitemap/RSS use sparse fieldsets** (H11 — only slug, updated_at)
- [ ] **File upload validates MIME + size** (H10)
- [ ] **JWT has 1h expiration, secret from env** (M6)
- [ ] **PBKDF2 used (not scrypt)** (C1)
- [ ] **SEO uses nullable FKs (not polymorphic)** (C2)
- [ ] **All slugs use UNIQUE(slug, locale) composite** (H1)
- [ ] **`future: { compatibilityVersion: 5 }`** set in both layer AND cooking-blog nuxt.config.ts
- [ ] **Nitro tasks enabled** (`nitro: { experimental: { tasks: true } }`)
- [ ] **@nuxtjs/seo upgraded from v3 to v5** in cooking-blog
- [ ] **`hub:db` virtual module works** (NOT `hubDatabase()` — v0.10 API)
- [ ] **`npx nuxt db generate` produces migrations** (NOT `drizzle-kit generate`)
- [ ] **Adapter file named `useStrapi.ts`** (H4)
- [ ] **`password_hash` never in API responses** (M7)
- [ ] **Legacy /uploads/ URLs rewritten to Blob** (H12)
- [ ] **First admin bootstrap works** (H6)
- [ ] **Rate limiting on login** (M5)
- [ ] **Soft deletes (deleted_at) on all content** (M4)
