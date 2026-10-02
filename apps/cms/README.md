# apps/cms — CMS API + Admin UI

Custom CMS for [Journal du Cuistot](https://journalducuistot.fr): **Nuxt admin dashboard** and **REST API** (`/api/*`) backing `apps/web`. Replaces Strapi v5 as the content store; Strapi is still used as a **migration source**.

**Full inventory (routes, components, API, auth, import, tasks):** [`AGENTS.md`](./AGENTS.md).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Nuxt 4 (`compatibilityVersion: 5`), Cloudflare deployment via Alchemy `Website.Nuxt` |
| Admin UI | Nuxt UI 4 dashboard (French) |
| ORM / DB | Drizzle → SQLite (local libSQL) / Cloudflare D1 (prod) |
| Media | R2 (+ local binding in dev) |
| Auth | nuxt-auth-utils sessions + nuxt-authorization (`admin` / `editor`) |
| Validation | Zod (shared + server/utils/validations) |

## Admin features (current)

- Dashboard with content counts
- Articles, recipes, hierarchical pages (markdown), dual category types (blog + recipes)
- Markdown editors, cover picker, SEO panel, publish / schedule / unpublish (admin)
- Media library (folders, upload, image optimization, accessibility metadata)
- Publishing calendar and backlog
- Strapi import wizard (step coverage, dry-run, targeted slug test)
- Maintenance purge with confirmation phrase

## Commands

```bash
# From monorepo root
pnpm dev:cms

# From apps/cms
pnpm dev                  # migrate local DB, then Nuxt on :3001
pnpm test
pnpm db:migrate:local
pnpm db:seed:admin
pnpm task:seed:admin
pnpm task:strapi-extract
pnpm clone:prod              # import prod D1 + media into .data/ (see below)
```

## Clone remote CMS data locally (transfer API key)

Pull **articles / recipes / media** (including drafts) into this instance — **no Cloudflare credentials**.

### Admin UI

1. On the **source** CMS: **Clés API & transfert** → create a key with the scopes you need.
2. On the **destination** CMS (often local): same page → **Pull depuis un CMS distant**  
   enter origin URL + key (no `.env` required). Use dry-run first; type `IMPORTER` to write.

### CLI

```bash
pnpm cms:clone:prod -- --origin=https://admin.example.com --key=jdc_…
pnpm cms:clone:prod -- --scopes=articles,media --dry-run
```

Origin / key can also come from `CMS_CLONE_CMS_ORIGIN` (or `PROD_CMS_HOST`) and `CMS_TRANSFER_KEY`.

| Variable | Purpose |
|----------|---------|
| `CMS_TRANSFER_KEY` | Optional CLI default for `--key` |
| `CMS_CLONE_CMS_ORIGIN` / `PROD_CMS_HOST` | Optional CLI default for `--origin` |
| `CMS_TRANSFER_PULL_ENABLED` | Set `0`/`false` to disable source transfer routes |
| `CMS_TRANSFER_ALLOW_LOCAL_ORIGIN` | Set `1` to allow admin pull from localhost |
| `CMS_TRANSFER_ALLOW_WORKER_MEDIA` | Set `1` to override the Workers media-pull block (not recommended) |
| `CMS_API_KEY_PEPPER` | Optional hash pepper (defaults to `NUXT_SESSION_PASSWORD`) |

Transfer routes: `GET /api/transfer/articles|recipes|media` (+ `GET /api/transfer/media/file`).  
Admin pull: `POST /api/admin/transfer/pull`.

## Local vs deploy

| Path | Database | Migrations |
|------|----------|------------|
| `pnpm dev:cms` | `.data/db/sqlite.db` (libSQL) | `scripts/migrate-local.ts` before Nuxt |
| `pnpm dev:infra` (repo root) | Alchemy local D1 + bindings via `Website.Nuxt` | D1 migrations from Alchemy; Nuxt HMR + `event.context.cloudflare` (wrangler-free) |
| `pnpm alchemy deploy` (repo root) | Cloudflare D1 | Drizzle migrations in `server/db/migrations/sqlite/` |

**Editor AI (`POST /api/completion`)** needs the Workers AI binding (`env.AI`). Use `pnpm dev:infra` for Alchemy's wrangler-free local binding proxy; standalone `pnpm dev:cms` uses the local database and the generation fallback without Cloudflare bindings. Alchemy: `Cloudflare.Website.Nuxt` + `Cloudflare.AI.Gateway` + `Cloudflare.Workers.AI()` in `infra/workers.ts` — redeploy after infra changes.

**Media picker (Stock + IA):** optional `PEXELS_API_KEY` enables the Pexels Stock tab; IA generation needs `env.AI` + AI Gateway `jdc-cms-ai` with **Unified Billing** for catalog image models. See [`AGENTS.md` — Commands & env](./AGENTS.md#commands--env).

## Admin seeder

| Mechanism | When | Auth |
|-----------|------|------|
| `GET /api/auth/setup-status` | Diagnose D1 (`emptyUsers`, `hasAdmin`) | Public |
| `POST /api/auth/register` | **Zero rows** in `users` → first account is `admin` | Public |
| `POST /api/auth/seed-admin` | **No `admin` role** yet, or empty `users` | No secret |
| Same + `resetPassword: true` | Admin exists, set new password | `ADMIN_SEED_SECRET` header |
| `pnpm task:seed:admin` / `/_nitro/tasks/seed-admin` | Local dev only (Nitro dev server HTTP) | No auth on task |
| `pnpm db:seed:admin` | Local `.data/db/sqlite.db` only | CLI |

Env defaults: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `ADMIN_SEED_FORCE`, `ADMIN_SEED_SECRET` on worker for prod recovery.

If an admin already exists with default seed, try login with `changeme123` before resetting password.

First user can also be created via `POST /api/auth/register` when the `users` table is empty (bootstrap → `admin`).

## Environment

See [`AGENTS.md` — Environment](./AGENTS.md#commands--env). Typical local: `STRAPI_URL`, `STRAPI_API_TOKEN` for import; `NUXT_PUBLIC_SITE_URL` for public links.
