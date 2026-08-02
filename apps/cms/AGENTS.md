# apps/cms — Journal du Cuistot CMS + Admin

## OVERVIEW

**Nuxt 4** app (`future.compatibilityVersion: 5`) on **port 3001**. Serves:

1. **French admin UI** — Nuxt UI dashboard for content, media, planning, Strapi import, and maintenance.
2. **REST API** under `/api/*` — consumed by `apps/web` and by the admin itself.

Persistence: **Drizzle ORM** on SQLite (local libSQL at `.data/db/sqlite.db` in dev; **Cloudflare D1** in production via Nitro `cloudflare_module` preset). Media: **R2** (local bucket binding in dev). Sessions: **nuxt-auth-utils** (sealed cookie, 8h max age). Authorization: **nuxt-authorization** with roles `admin` | `editor` (`shared/abilities.ts`).

Replaces Strapi v5 as the system of record; Strapi remains a **migration source** via the import UI and extract services.

## STRUCTURE

```
apps/cms/
├── app/                          # Admin UI (~/ resolves here)
│   ├── assets/css/main.css       # Tailwind 4 entry
│   ├── components/
│   │   ├── content/              # Editors, lists, SEO, publish actions, markdown
│   │   ├── media/                # Gallery card, detail slideover
│   │   ├── planning/             # Calendar + backlog
│   │   ├── AppDashboardPanel.vue # UDashboardPanel wrapper
│   │   ├── AppDashboardNavbar.vue
│   │   ├── BrandMenu.vue
│   │   └── UserMenu.vue
│   ├── composables/              # Publishing, calendar, Strapi import, deferred media
│   ├── layouts/default.vue       # Sidebar nav + UDashboardSearch
│   ├── middleware/auth.global.ts # Session gate (all pages except /login)
│   ├── pages/                    # File-based admin routes (see below)
│   ├── plugins/api.ts            # $api — SSR cookie forwarding via useRequestFetch
│   ├── types/                    # cms.ts, content-editor.ts, api.d.ts
│   └── utils/                    # content-status, field labels, media upload helpers
├── server/
│   ├── api/                      # REST handlers (public read + authenticated write)
│   ├── db/
│   │   ├── schema/               # Drizzle tables (exported via schema.ts)
│   │   ├── migrations/sqlite/  # Shared local + D1 migrations
│   │   ├── queries/              # All Drizzle I/O — useQueries(); see queries/README.md
│   │   └── seed/                 # Admin seed helpers
│   ├── plugins/                  # session refresh, authorization resolver
│   ├── routes/images/            # Public IPX image transform + R2 serve (+ Cache API)
│   ├── services/                 # Publishing, calendar, Strapi import, maintenance, extract/*
│   ├── tasks/                    # Nitro tasks (seed, publish-scheduled, strapi-extract)
│   └── utils/                    # db, r2, populate, pagination, validations, admin handlers
├── shared/                       # Isomorphic: abilities, slug, calendar, strapi-import, media
├── scripts/                      # migrate-local.ts, seed-admin.ts
├── test/                         # Vitest unit + nuxt + e2e projects
├── nuxt.config.ts
├── app.config.ts                 # Nuxt UI theme (orange primary, stone neutral)
└── README.md                     # Quick start; see this file for full map
```

## ADMIN UI — ROUTES

| Route | File | Purpose |
|-------|------|---------|
| `/login` | `pages/login.vue` | `layout: false`, no auth middleware; `UAuthForm` → `POST /api/auth/login` |
| `/` | `pages/index.vue` | Dashboard counts (articles, recipes, pages, categories) |
| `/articles` | `pages/articles/index.vue` | `ContentListPanel` → `/api/articles` |
| `/articles/new` | `pages/articles/new.vue` | Create article (`ContentArticleForm`) |
| `/articles/:id` | `pages/articles/[id].vue` | Edit article |
| `/recipes` | `pages/recipes/index.vue` | Recipe list |
| `/recipes/new`, `/recipes/:id` | | Create / edit (`ContentRecipeForm`) |
| `/pages` | `pages/pages/index.vue` | `ContentPagesListPanel` (hierarchy) |
| `/pages/new`, `/pages/:id` | | Create / edit CMS pages (`ContentPageForm`) |
| `/categories` | `pages/categories/index.vue` | Combined table: blog (`category-articles`) + recipe (`categories`) |
| `/categories/new` | `pages/categories/new.vue` | `ContentCategoryForm` (type picker) |
| `/planning` | `pages/planning/index.vue` | Publishing calendar + backlog (`usePublishingCalendar`) |
| `/generate` | `pages/generate/index.vue` | AI composer → creates run + starts `CONTENT_GENERATION` Workflow (fallback: processRunOnce) |
| `/generate/:id` | `pages/generate/[id].vue` | Run progress, draft link, cross-review approve (`sendEvent` to Workflow) |
| `/media` | `pages/media/index.vue` | Folder browser, grid/table, upload, drag-drop, client image optimize |
| `/import` | `pages/import/index.vue` | Strapi migration panel (`useStrapiImportPanel`) |
| `/maintenance` | `pages/maintenance/index.vue` | Counts + selective purge (admin API) |

**HITL / multi-content:** Layer A uses `generation-review` (`approve` | `reject` | `request_changes`) — articles get review→revise×2 then final gate; recipes single gate. Inbox at `/generate/review`. Ebook `sourceKind` creates a **batch** parent (`normalize`→`discover`→`awaiting_selection`); candidate picker spawns N unit children. Schema: `parent_run_id` / `run_kind` / `review_round`. Design: `generation-hitl-multi-content.canvas.tsx`.

**Layout:** `layouts/default.vue` — `UDashboardGroup` + collapsible sidebar. Keyboard shortcuts via `useDashboard`: `g-h` home, `g-a` articles, `g-r` recipes, `g-p` pages, `g-c` categories, `g-m` media, `g-g` generate, `g-i` import.

**Chrome:** `app/utils/dashboard-shell.ts` — shared table/navbar/surface classes used across list and editor pages.

## ADMIN UI — COMPONENTS

### Shell

| Component | Role |
|-----------|------|
| `AppDashboardPanel` | Page shell with header slot + body |
| `AppDashboardNavbar` | Sticky title bar (`mergeDashboardNavbarUi`) |
| `BrandMenu` / `UserMenu` | Sidebar header / footer |

### Lists

| Component | Role |
|-----------|------|
| `ContentListPanel` | Paginated TanStack table, search, status filter, edit links |
| `ContentPagesListPanel` | Pages with parent hierarchy labels |

### Editors (shared patterns)

| Component | Role |
|-----------|------|
| `ContentEditorDetailLayout` | Breadcrumb, loading, toolbar teleports |
| `ContentEditorBodyLayout` | Section nav + main column |
| `ContentEditorSection` / `EditorSectionNav` | In-page anchors |
| `MarkdownEditor` | TipTap-based markdown (Nuxt UI editor) |
| `ContentCoverField` + `CoverAccessibilityFields` | Media picker + alt/description |
| `ContentSeoPanel` | description, keywords, metaRobots |
| `ContentEditorFormActions` | Save + delete |
| `ContentPublishScheduleActions` | Publish now / schedule / unpublish (`useContentPublishing`) |
| `ContentSchedulePublicationModal` | Date picker for scheduling |
| `ContentStatusBadge` | draft / published / scheduled |
| `ContentMediaPickerModal` | Browse/upload for covers and inline media |
| `ContentCategoryRelationField` | Blog category select |
| `ContentPageParentRelationField` | Parent page for hierarchy |
| `ContentIngredientRows` / `UtensilRows` | Recipe sub-entities |

### Domain forms

| Component | Content type | Notable fields |
|-----------|--------------|----------------|
| `ContentArticleForm` | Articles | title, slug, markdown, blog category, cover, SEO; **deferred media** on create (`useDeferredArticleMedia`) |
| `ContentRecipeForm` | Recipes | intro, steps markdown, difficulty, time, ingredients, utensils, nutrition, recipe category, cover, SEO |
| `ContentPageForm` | Pages | name, title, markdown, parent, locale, public path preview (`pagePublicPath`) |
| `ContentCategoryForm` | Categories | blog vs recipe type, slug, optional cover |

### Planning & media

| Component | Role |
|-----------|------|
| `PublishingCalendar` | Month grid, drag reschedule (`planning/PublishingCalendar.vue`) |
| `CalendarBacklog` | Unscheduled drafts |
| `CalendarEventCard` | Event chip |
| `MediaGalleryCard` | Grid tile |
| `MediaDetailSlideover` | Metadata edit, delete |

## ADMIN UI — COMPOSABLES

| Composable | Role |
|------------|------|
| `useDashboard` | Global shortcuts; shared sidebar state hook point |
| `useContentPublishing` | `POST /api/admin/{type}/{id}/publish|schedule|unpublish` + toasts |
| `usePublishingCalendar` | Fetches `/api/admin/calendar`, groups by day, reschedules via schedule API |
| `useStrapiImportPanel` | Import config, run/reset, dry-run, step selection |
| `useDeferredArticleMedia` | Queue cover/uploads until first save on new articles |

## AUTH & RBAC

| Ability | Roles | Used for |
|---------|-------|----------|
| `canEditContent` | admin, editor | CRUD on articles, recipes, pages, categories, media folders, SEO PUT |
| `canManageUsers` | admin | `POST /api/auth/register` after bootstrap |
| `canAccessAdminApi` | admin | Publish/schedule/unpublish (admin routes), calendar, Strapi import, maintenance |

**Session:** `nuxt-auth-utils` + Nitro `server/plugins/session.ts` reloads user from DB on each session fetch. **Login:** PBKDF2 password verify, KV-backed rate limit (5 failures / 15 min per IP). **Bootstrap:** first `POST /api/auth/register` with empty `users` table creates admin and logs in; no UI for register yet (API only).

**Client gate:** `app/middleware/auth.global.ts` redirects unauthenticated users to `/login` (skips assets, `/api`, file extensions).

**Editor caveat:** Editors can save drafts; **publish, schedule, unpublish, import, and maintenance require `admin`** because those handlers call `canAccessAdminApi`.

## PUBLISHING WORKFLOW

**Statuses:** `draft` | `published` | `scheduled` (`app/utils/content-status.ts`).

**Content types:** `articles`, `recipes`, `pages`, `categories`, `category-articles` (`server/utils/content-types.ts`).

| Mechanism | Implementation |
|-----------|----------------|
| Immediate publish | `createPublishingService().publish()` — sets `publishedAt`, clears `scheduledAt`; articles/recipes set `firstPublishedAt` once |
| Schedule | `schedule()` — `scheduledAt` ISO; UI uses **09:00 Europe/Paris** (`shared/calendar.ts`) |
| Unpublish | Back to `draft` |
| CRON | Production Nitro `scheduledTasks`: `*/5 * * * *` → task `publish-scheduled` |
| Admin API | `/api/admin/[contentType]/[id]/publish|schedule|unpublish` (+ legacy `/api/admin/articles/:id/*`) |
| Alternate API | `/api/publish`, `/api/schedule`, `/api/unpublish` (same service, admin-only) |

**Planning UI:** `GET /api/admin/calendar?from&to&locale&types&includePublished&backlogLimit` → `calendar-service.ts`.

## REST API — ROUTE MAP

### Auth & health

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Bootstrap or admin |
| GET | `/api/health` | Public |
| POST | `/api/completion` | Editor+ — streaming editor AI (Workers AI + `jdc-cms-ai` gateway); KV rate limit 30/min per user+IP |

### Content CRUD (Strapi-like pagination)

Collections: **articles**, **recipes**, **pages**, **categories**, **category-articles**.

Typical pattern: `GET/POST /api/{collection}`, `GET/PUT/DELETE /api/{collection}/:id`. Mutations require `canEditContent`. List/detail support `page`, `pageSize`, `include` (populate allowlist via `parseInclude` / `buildWithObject`).

**Public read rule:** Unauthenticated GET on single resources filters to `status=published` and `deleted_at IS NULL` (see article/recipe/page GET handlers).

### SEO

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/seo/:contentType/:contentId` | Public (published content) |
| PUT | `/api/seo/:contentType/:contentId` | Editor+ |

SEO table uses nullable FKs per content type (not polymorphic).

### Media

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/media` | List blobs/folders (prefix, cursor) |
| POST | `/api/media` | Upload |
| GET/PATCH/DELETE | `/api/media/item` | Single blob metadata |
| GET/DELETE | `/api/media/[pathname]` | By path |
| POST/DELETE | `/api/media/folder` | Folder create/delete |

Images: … `GET /images/{modifiers}/{pathname}` … Workers Cache enabled via Alchemy `cache` prop ([ADR-006](../../docs/architecture/adr-006-image-delivery-cloudflare.md)); purge on delete via `workers-image-cache.ts`. Admin HTML uses `private, no-store` middleware.

### Admin-only

| Method | Path |
|--------|------|
| GET | `/api/admin/calendar` |
| GET | `/api/admin/strapi-import` |
| POST | `/api/admin/strapi-import/run` |
| POST | `/api/admin/strapi-import/reset` |
| GET | `/api/admin/maintenance` |
| POST | `/api/admin/maintenance/purge` |
| GET | `/api/admin/articles` | (admin article listing helper) |

## STRAPI IMPORT

**UI:** `/import` — step checkboxes (`STRAPI_IMPORT_STEPS`), dry-run, connection test, per-step coverage badges, targeted slug test import.

**Steps (FK order):** `category-articles`, `categories`, `articles`, `recipes`, `pages` with dependencies in `shared/strapi-import.ts`.

**Server:** `services/extract/*` (Strapi client, per-entity importers, zones→markdown for legacy content), `strapi-import-runner.ts`, `legacy_strapi_map` table for id mapping.

**Config:** `runtimeConfig.strapiUrl`, `strapiApiToken`, optional `strapiUploadsOrigin`.

**Tasks:** `pnpm task:strapi-extract` → Nitro task `strapi-extract` (CLI/batch path).

**Media hydrate (Plan B):** After content import, run **`pnpm media:hydrate`** (plain Node → `.data/db` + `.data/media`). Downloads remaining `/uploads/…` with paced requests and rewrites markdown. Options: `--dry-run`, `--slug=…`, `--delay=500`. Avoids Cloudflare Worker subrequest limits. Optional Nitro alias: `pnpm task:strapi-media-hydrate` (requires running Nitro).

## MAINTENANCE

**UI:** `/maintenance` — live counts per purge target, confirmation phrase (`shared/maintenance.ts`).

**Service:** `maintenance-purge.ts` — selective wipe of content, legacy media map, or full media library (R2 + `blobs`).

## DATABASE — TABLES

| Table | Purpose |
|-------|---------|
| `users` | Admin accounts (PBKDF2 `password_hash`, role) |
| `sessions` | Session storage (if used by auth utils) |
| `articles` | Blog posts; FK to `category_articles`, cover blob |
| `recipes` | Recipes; FK to `categories` |
| `ingredients`, `recipe_utensils`, `nutrition`, `reviews` | Recipe components |
| `pages` | Hierarchical CMS pages (`parent_id`), markdown `content` |
| `categories` | Recipe categories (+ `category_blobs`) |
| `category_articles` | Blog categories |
| `seo` | Per-entity SEO rows |
| `social_meta` | Social metadata |
| `blobs` | Media metadata (pathname PK, file metadata columns) |
| `content_revisions` | Revision history |
| `audit_events` | Audit log |
| `legacy_strapi_map` | Strapi id ↔ local id for import |

**Conventions:** `UNIQUE(slug, locale)` on content; soft delete `deleted_at`; locale default `fr`.

## NITRO TASKS

| Task | Script / trigger | Role |
|------|------------------|------|
| `seed-admin` | `pnpm task:seed:admin` | Create admin user (deploy/CLI) |
| `publish-scheduled` | CRON `*/5 * * * *` (production) | `publishDueScheduled()` |
| `strapi-extract` | `pnpm task:strapi-extract` | Batch Strapi extraction |
| `strapi-media-hydrate` | Prefer `pnpm media:hydrate` | Download leftover `/uploads` media (Node CLI) |

## SHARED PACKAGE (`shared/`)

Code imported from both `app/` and `server/` via `#shared/*`: `abilities`, `slug`, `calendar`, `strapi-import`, `maintenance`, `media`, `media-paths`, `page-hierarchy`, `public-site-paths`, `validators/auth`, image optimize helpers.

## TESTS

```bash
pnpm --filter cms test           # all projects
pnpm --filter cms test:unit      # utils, import, auth, calendar, media, …
pnpm --filter cms test:nuxt      # component smoke
pnpm --filter cms test:e2e       # Playwright browser (placeholder)
```

Notable suites: `auth.test.ts`, `calendar.test.ts`, `strapi-import-format.test.ts`, `media-accessibility.test.ts`, `page-hierarchy.test.ts`.

## COMMANDS & ENV

```bash
pnpm dev:cms              # from repo root — migrate local DB + Nuxt :3001
pnpm --filter cms db:migrate:local
pnpm --filter cms db:seed:admin
```

| Variable | Purpose |
|----------|---------|
| `NUXT_PUBLIC_SITE_URL` | Public site URL (links, OG defaults) |
| `STRAPI_URL` | Legacy Strapi base for import |
| `STRAPI_API_TOKEN` | Strapi API token for import |
| `STRAPI_UPLOADS_ORIGIN` | Optional CDN origin for Strapi uploads during import |
| `NUXT_SEO_PRO_API_KEY` | Nuxt SEO Pro MCP Bearer token (in-app content agent keyword tools) |
| `NUXT_SEO_PRO_MCP_URL` | Optional override (default `https://nuxtseo.com/mcp/pro`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Deploy-time admin seed |
| Cloudflare bindings | `DB` (D1), `Media` (R2), `Cache` (KV), `AI` (Workers AI), `CMS_AI_GATEWAY_ID` (`jdc-cms-ai`) — see `nuxt.config.ts` nitro.cloudflare; image architecture [ADR-006](../../docs/architecture/adr-006-image-delivery-cloudflare.md) |
| `CMS_AI_GATEWAY_ID` | Cloudflare AI Gateway id for Workers AI (`workers-ai-provider`); default `jdc-cms-ai` |

## CONVENTIONS

### Database access (query layer)

All Drizzle I/O lives in `server/db/queries/` — see [`server/db/queries/README.md`](server/db/queries/README.md). HTTP handlers use **`useQueries(event)`** for CRUD reads/writes, or domain **`usePublishingService` / `useCalendarService` / `useDashboardService` / `useMaintenanceService`** (each wraps `createDbQueries(useDb(event))`). Avoid `useDb` + raw query factories in routes. **`health`** and **seed/tasks** may call `useDb()` for connectivity or legacy seed helpers.

### Admin data fetching

- Use `$api` from `plugins/api.ts` (never raw `$fetch` in SSR pages that need auth).
- List pages: `useAsyncData` + `$api` with pagination query params (API uses 1-based `page` in list handlers).
- Editor pages: `include=cover,category,seo` (or recipe equivalents) on GET.

### Forms

- Zod schemas inline in form components; slug auto from title on create via `#shared/slug`.
- Save → `PUT` or `POST` collection endpoint; SEO → `PUT /api/seo/...` when panel touched.
- Publishing actions are separate from save (admin API). Canonical routes: `/api/admin/.../publish|schedule|unpublish`; legacy `/api/publish|schedule|unpublish` delegate to the same handlers.

### API errors

Structured via `createApiError` (`server/utils/errors.ts`); query modules throw `QueryError` — map with `fromQueryError` in handlers/services. Login/register use Zod + consistent JSON error shape.

## RELATION TO `apps/web`

Public site fetches CMS JSON over HTTP (`NUXT_PUBLIC_CMS_BASE_URL`, default `http://localhost:3001`). Web proxies CMS images via its own `server/routes/images` and utilities under `apps/web/server/utils/`. Content shape should stay aligned with [cms-strapi-schema-audit.md](../../docs/architecture/cms-strapi-schema-audit.md).

## ANTI-PATTERNS

- **Do not use `$fetch` in SSR admin pages for authenticated APIs** — use `$api` / `useRequestFetch`.
- **Do not bypass populate allowlists** — unknown `include` relations are stripped in `buildWithObject`.
- **Do not assume editors can publish** — check role or use admin test account.
- **README legacy note:** Auth is session-based (nuxt-auth-utils), not standalone JWT cookies for the admin UI.
