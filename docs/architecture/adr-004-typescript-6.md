# ADR-004: TypeScript 6 across the monorepo

## Status

**Accepted** — configured on both apps (2026-07-12)

## Context

Journal du Cuistot is a TypeScript-first monorepo: Nuxt SFCs, Nitro server routes, Drizzle schemas, Zod validations, and Vitest tests. Staying on a supported TypeScript major avoids lag behind Nuxt 4.4.x and `vue-tsc` 3.x.

## Decision

1. **Standardize on TypeScript 6.0.x** via the pnpm catalog:

   ```yaml
   catalog:
     typescript: '^6.0.3'
     vue-tsc: '^3.2.9'
   ```

2. **Both apps declare explicit devDependencies:**

   ```json
   "typescript": "catalog:",
   "vue-tsc": "catalog:"
   ```

3. **Per-app `tsconfig.json`** follows Nuxt conventions (references `.nuxt/tsconfig.*.json` after `nuxt prepare`).

4. **Root `tsconfig.json`** — solution-style references to `apps/web` and `apps/cms` for IDE navigation.

5. **Typecheck scripts:**

   | Command | Runs |
   |---------|------|
   | `pnpm --filter web typecheck` | `nuxt typecheck` |
   | `pnpm --filter cms typecheck` | `nuxt typecheck` |
   | `pnpm typecheck` | both apps (`pnpm -r typecheck`) |

6. **Policy:**
   - Type-based `defineProps<{...}>()` for new components
   - Prefer extending `~/types/` over `as any` for API responses
   - Exhaustive `switch` with `never` default for discriminated unions

7. **Node** — `engines.node >= 20` (root `package.json`).

## Consequences

### Positive

- **Catalog-driven upgrades** — bump `typescript` once in `pnpm-workspace.yaml`.
- **Parity** — web and CMS on the same TS major; IDE resolution consistent.
- **Clear CI split** — oxlint (lint) + oxfmt (format) + typecheck (types).

### Negative / trade-offs

- **No `strict: true` mandate yet** — Nuxt-generated tsconfig defaults apply; tightening is a follow-up.
- **Hand-written types on web** — API types maintained separately from Drizzle ([ADR-002](./adr-002-schemas-in-cms-not-shared-package.md)).
- **Clean CI needs `nuxt prepare`** — `.nuxt/` types must exist before `typecheck`.

### Follow-ups

- Add `pnpm typecheck` to CI alongside lint/format
- Gradually remove `as any` on Strapi/CMS boundaries
