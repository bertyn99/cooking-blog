# ADR-002: Drizzle schemas in `apps/cms` only (no `packages/db`)

## Status

**Accepted** — T0 complete (2026-07-12)

## Context

Early migration planning ([`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md)) proposed a shared workspace package:

```
packages/db/          # @journalducuistot/db — Drizzle schemas + types
```

Both `apps/web` and `apps/cms` would import `@journalducuistot/db/schema` so table definitions and TypeScript types stayed in one place.

At T0, the actual integration model is:

- **`apps/web`** reads content exclusively via **HTTP JSON** (`useStrapi` → `cmsBaseUrl/api/*`).
- **`apps/cms`** is the **only** application that opens a database connection (Drizzle + SQLite today; D1 via Alchemy v2 planned).

No code path in web executes SQL, runs migrations, or needs table-level types at build time. Web cares about API response shapes, not column definitions.

Extracting schemas into `packages/db` would add:

- A third workspace package to version, build, and keep in sync
- Cross-package imports from CMS (`import * as schema from '@journalducuistot/db/schema'`)
- Temptation for web to import DB types directly, coupling the frontend to storage schema

## Decision

1. **Do not** add `packages/db` to the pnpm workspace.

2. Keep all Drizzle table definitions under:

   ```
   apps/cms/server/db/schema/
   ├── articles.ts
   ├── recipes.ts
   ├── pages.ts
   ├── categories.ts
   ├── ingredients.ts
   ├── nutrition.ts
   ├── reviews.ts
   ├── seo.ts
   ├── social-meta.ts
   ├── blobs.ts
   └── users.ts
   ```

3. CMS server code imports schemas locally (e.g. `~/server/db/schema/articles` or a barrel re-export).

4. **Web types** remain separate:
   - Hand-written types in `apps/web/app/types/` where needed
   - Inferred from API responses in composables and pages
   - No dependency on Drizzle or CMS schema files

5. **Migrations** are owned by CMS (`pnpm --filter cms db:generate` / `db:migrate` via NuxtHub today; Drizzle + Alchemy `migrationsDir` planned).

## Consequences

### Positive

- **Single writer** — one app owns the schema; no split-brain between package and CMS.
- **Simpler workspace** — `pnpm-workspace.yaml` lists `apps/*` only.
- **Enforces API boundary** — web cannot accidentally import `drizzle-orm` or SQL builders.
- **Faster T0** — no package extraction, no dual tsconfig project references for `packages/db`.

### Negative / trade-offs

- **No shared row types** — if web needs stricter typing, duplicate or generate types from OpenAPI/JSON Schema (not done at T0).
- **Future admin UI** — if a Nuxt admin app is added under `apps/admin`, it will also consume HTTP or need a deliberate shared-types strategy (not `packages/db` unless requirements change).
- **Plan drift** — `IMPLEMENTATION_PLAN.md` still mentions `packages/db` in places; this ADR supersedes that for T0.

### When to revisit

Reintroduce a shared package only if a **second database consumer** appears (e.g. a background worker outside CMS that must share Drizzle schema and migrations, or generated client types consumed by multiple apps). Until then, colocation in CMS is the source of truth.
