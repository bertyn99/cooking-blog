# layer-blog-cms — Custom CMS Layer

API-only Nuxt layer replacing Strapi v5 CMS for Journal du Cuistot.

- **Database**: Cloudflare D1 (Alchemy v2 + `Drizzle.Schema`)
- **ORM**: Drizzle ORM — 13 tables (articles, recipes, categories, pages, users + components)
- **Storage**: Cloudflare R2 via Alchemy
- **Auth**: JWT + RBAC (PBKDF2, 1h tokens, KV rate limiting)
- **i18n**: Locale-aware schemas with `UNIQUE(slug, locale)` composite constraint

## Directory Structure

```
server/
├── api/              # 38 CRUD routes (auth, articles, recipes, categories, pages, media, seo, publish, schedule, health)
├── db/schema/        # Drizzle ORM table definitions
├── db/seed/          # Admin seeder (D1 + Drizzle)
├── middleware/       # JWT auth middleware
├── routes/          # Image serving via blob.serve
├── tasks/           # Scheduled publishing CRON
└── utils/           # Auth, validations, query builders, pagination, populate, errors, slug, media
    └── validations/ # Zod schemas per domain
    └── queries/     # Reusable query builders (articles, recipes, pages)
```

## Commands

```bash
pnpm dev             # Applies local migrations, then starts Nuxt (libSQL `.data/db/sqlite.db`)
pnpm test            # Vitest tests
pnpm db:migrate:local # Apply migrations manually
pnpm db:seed:admin   # Manual admin seed against D1 (see below)
```

### Local dev vs Alchemy deploy

| Command | Database | Migrations |
|---------|----------|------------|
| `pnpm dev:cms` | libSQL `.data/db/sqlite.db` | `db:migrate:local` runs automatically before Nuxt |
| `pnpm alchemy deploy` | Cloudflare D1 | `Drizzle.Schema` + `Cloudflare.D1.Database` |

Migrations live in `server/db/migrations/sqlite/` and are shared between both paths.

## Admin seeder

The initial admin is seeded by Alchemy `Command.Exec` when `ADMIN_PASSWORD` is set in the deploy environment. It runs after D1 migrations and uses Drizzle against Cloudflare D1.

```bash
# Automatic (recommended) — set in your deploy / alchemy env
ADMIN_EMAIL=admin@journalducuistot.fr
ADMIN_PASSWORD='your-secure-password'
pnpm alchemy deploy
```

Manual seed against D1 (requires Cloudflare API credentials):

```bash
CLOUDFLARE_ACCOUNT_ID=... \
D1_DATABASE_ID=... \
CLOUDFLARE_API_TOKEN=... \
ADMIN_EMAIL=admin@journalducuistot.fr \
ADMIN_PASSWORD='your-secure-password' \
pnpm --filter cms db:seed:admin
```

Optional: `ADMIN_USERNAME`, `ADMIN_SEED_FORCE=1`.

## Key Design Decisions

- **Nullable FKs for SEO** — NOT polymorphic relations (`article_id`, `recipe_id`, `page_id` columns), enabling native Drizzle `with` queries
- **Soft deletes** on all content tables via `deleted_at`
- **Draft protection** — unauthenticated GET auto-filters `status='published' AND deleted_at IS NULL`
- **First-admin bootstrap** — register user when users table is empty (API fallback)
- **Nitro CRON** for scheduled publishing (`*/5 * * * *`)
- **Nuxt 5 compat** via `future: { compatibilityVersion: 5 }`
