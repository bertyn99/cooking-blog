# apps/cms — CMS API + Admin UI

Custom CMS for [Journal du Cuistot](https://journalducuistot.fr): **Nuxt admin dashboard** and **REST API** (`/api/*`) backing `apps/web`. Replaces Strapi v5 as the content store; Strapi is still used as a **migration source**.

**Full inventory (routes, components, API, auth, import, tasks):** [`AGENTS.md`](./AGENTS.md).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Nuxt 4 (`compatibilityVersion: 5`), Nitro `cloudflare_module` |
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
```

## Local vs deploy

| Path | Database | Migrations |
|------|----------|------------|
| `pnpm dev:cms` | `.data/db/sqlite.db` (libSQL) | `scripts/migrate-local.ts` before Nuxt |
| `pnpm alchemy deploy` (repo root) | Cloudflare D1 | Drizzle migrations in `server/db/migrations/sqlite/` |

## Admin seeder

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for deploy-time seed (`server/tasks/seed-admin.ts` / Alchemy). Manual D1 seed: `pnpm --filter cms db:seed:admin` (Cloudflare API env vars). Optional: `ADMIN_USERNAME`, `ADMIN_SEED_FORCE=1`.

First user can also be created via `POST /api/auth/register` when the `users` table is empty (bootstrap → `admin`).

## Environment

See [`AGENTS.md` — Environment](./AGENTS.md#commands--env). Typical local: `STRAPI_URL`, `STRAPI_API_TOKEN` for import; `NUXT_PUBLIC_SITE_URL` for public links.
