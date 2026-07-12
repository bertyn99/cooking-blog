# Architecture Overview

**Status:** T0 complete (monorepo foundation)  
**Last updated:** 2026-07-12

Journal du Cuistot is a French cooking blog migrating from Strapi v5 to a self-hosted Nuxt stack. The codebase is a **pnpm monorepo** with two Nuxt applications and HTTP-based separation between read and write paths.

## Monorepo layout

```
journalducuistot/                 # pnpm workspace root
├── apps/
│   ├── web/                      # Public SSR frontend (port 3000)
│   │   ├── app/                  # pages, components, composables
│   │   ├── server/               # sitemap, RSS, legacy redirects
│   │   └── nuxt.config.ts
│   └── cms/                      # API-only backend (port 3001)
│       ├── server/
│       │   ├── api/              # REST CRUD, auth, media, publish workflow
│       │   ├── db/schema/        # Drizzle table definitions (CMS-only)
│       │   ├── tasks/            # scheduled jobs (e.g. publish-scheduled)
│       │   └── utils/
│       └── nuxt.config.ts
├── docs/                         # architecture docs and ADRs
├── .oxlintrc.json                # shared lint rules (root)
├── .oxfmtrc.json                 # shared format rules (root)
├── pnpm-workspace.yaml           # workspace + dependency catalog
└── package.json                  # root scripts (dev, build, lint, fmt)
```

**Not in the workspace (by design):**

- `packages/db` — Drizzle schemas stay in `apps/cms` only (see [ADR-002](./adr-002-schemas-in-cms-not-shared-package.md))
- `layers/` — removed; web no longer `extends` a CMS layer (see [ADR-001](./adr-001-monorepo-apps-web-cms.md))

Legacy root-level `app/`, `server/`, and `layers/` directories may still exist during migration; new work targets `apps/*` only.

## Application responsibilities

### `apps/web` — public frontend

| Concern | Implementation |
|---------|----------------|
| Rendering | Nuxt SSR, ISR route rules, French UI |
| Content fetch | `useStrapi()` adapter → HTTP to CMS (`runtimeConfig.public.cmsBaseUrl`) |
| SEO | `@nuxtjs/seo`, sitemap, OG images, schema.org |
| Markdown (current) | `@nuxtjs/mdc` — planned replacement with Comark |
| Server routes | Sitemap sources, RSS, legacy `/blog/:slug` redirects |
| Database | **None** — consumes JSON over HTTP only |

Default CMS URL: `http://localhost:3001` (override via `NUXT_PUBLIC_CMS_BASE_URL`).

### `apps/cms` — API backend

| Concern | Implementation |
|---------|----------------|
| API | Nitro REST under `/api/*` (articles, recipes, pages, categories, media, auth, SEO) |
| Persistence | Drizzle ORM + SQLite (local dev via NuxtHub; **planned:** Cloudflare D1 via Alchemy v2) |
| Auth | JWT + RBAC middleware on write routes |
| Media | Blob storage (R2 planned) |
| Tasks | Nitro scheduled tasks (e.g. `publish-scheduled` cron) |
| UI | Minimal — API-only; admin UI deferred |

## Data flow

```
┌─────────────┐     HTTP JSON      ┌─────────────┐     Drizzle      ┌─────────────┐
│  apps/web   │ ─────────────────► │  apps/cms   │ ───────────────► │  SQLite/D1  │
│  (SSR)      │  cmsBaseUrl/api/*  │  (Nitro)    │                  │  (content)  │
└─────────────┘                    └─────────────┘                  └─────────────┘
      │                                    │
      │ useStrapi().find()                 │ CRUD, auth, publish
      │ (Strapi-compat adapter)            │ media upload → blob/R2
      ▼                                    ▼
  Pages, listings,                    Source of truth for
  detail views                        articles, recipes, pages, …
```

1. **Read path:** `apps/web` pages call `useStrapi().find('articles', { filters, populate, pagination })`. The adapter translates Strapi-style query params to CMS REST (`include`, `status=published`, etc.) and `$fetch`es `cmsBaseUrl`.
2. **Write path:** Authenticated clients (future admin, migration tasks) call `apps/cms` directly. Web does not touch the database.
3. **Media:** CMS stores blob pathnames in D1/SQLite; web resolves covers via its image pipeline (`localImageSharp` provider + proxy).

## Shared toolchain

| Tool | Role |
|------|------|
| **pnpm catalog** | Pins `nuxt`, `drizzle-orm`, `typescript`, `oxlint`, `oxfmt`, `vitest`, etc. in `pnpm-workspace.yaml` |
| **Nuxt 4.4.5** | Both apps; `future.compatibilityVersion: 5` |
| **Oxlint + Oxfmt** | Lint and format (see [ADR-003](./adr-003-oxlint-oxfmt-tooling.md)) |
| **TypeScript 6** | Baseline for typechecking (see [ADR-004](./adr-004-typescript-6.md)) |

Root scripts:

```bash
pnpm dev          # parallel dev (web :3000, cms :3001)
pnpm dev:web
pnpm dev:cms
pnpm build
pnpm lint         # oxlint in all apps
pnpm fmt          # oxfmt in all apps
```

## Planned evolution (post-T0)

Documented in [`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md):

| Area | Current (T0) | Target |
|------|--------------|--------|
| Infrastructure | NuxtHub (`hub:db`, blob, kv) on CMS | **Alchemy v2** — D1, R2, KV, Cron as code |
| Markdown | `@nuxtjs/mdc` on web | **@comark/nuxt** |
| Migration | External Strapi v5 | **Strapi extract** Nitro task + per-entity services |
| Strapi module | Removed from web; adapter in `useStrapi.ts` | Full parity for `populate: "*"` and filters |

These are intentional next phases; T0 establishes the monorepo boundary and HTTP contract between web and CMS.
