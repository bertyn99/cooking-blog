# layer-blog-cms — Custom CMS Layer

API-only Nuxt layer replacing Strapi v5 CMS for Journal du Cuistot.

- **Database**: Cloudflare D1 via NuxtHub v0.10 (`hub:db`)
- **ORM**: Drizzle ORM — 13 tables (articles, recipes, categories, pages, users + components)
- **Storage**: NuxtHub Blob for media
- **Auth**: JWT + RBAC (PBKDF2, 1h tokens, KV rate limiting)
- **i18n**: Locale-aware schemas with `UNIQUE(slug, locale)` composite constraint

## Directory Structure

```
server/
├── api/              # 38 CRUD routes (auth, articles, recipes, categories, pages, media, seo, publish, schedule, health)
├── db/schema/        # Drizzle ORM table definitions
├── middleware/       # JWT auth middleware
├── routes/          # Image serving via blob.serve
├── tasks/           # Scheduled publishing CRON
└── utils/           # Auth, validations, query builders, pagination, populate, errors, slug, media
    └── validations/ # Zod schemas per domain
    └── queries/     # Reusable query builders (articles, recipes, pages)
```

## Commands

```bash
pnpm dev             # Dev server (part of cooking-blog via extends)
pnpm test            # Vitest tests
pnpm db:generate     # Generate D1 migrations (npx nuxt db generate)
pnpm db:migrate      # Apply migrations to D1
```

## Key Design Decisions

- **Nullable FKs for SEO** — NOT polymorphic relations (`article_id`, `recipe_id`, `page_id` columns), enabling native Drizzle `with` queries
- **Soft deletes** on all content tables via `deleted_at`
- **Draft protection** — unauthenticated GET auto-filters `status='published' AND deleted_at IS NULL`
- **First-admin bootstrap** — register user when users table is empty
- **Nitro CRON** for scheduled publishing (`*/5 * * * *`)
- **Nuxt 5 compat** via `future: { compatibilityVersion: 5 }`
