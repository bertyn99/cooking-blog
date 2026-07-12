# ADR-003: Oxlint and Oxfmt for lint and format (replacing ESLint)

## Status

**Accepted** — ESLint fully removed (2026-07-12). Migration validated via `@oxlint/migrate`.

## Context

The monorepo used **ESLint** via `@nuxt/eslint`, with Nuxt-generated flat configs and stylistic rules in `apps/cms/nuxt.config.ts`. ESLint + TypeScript + Vue parsing is flexible but slow on large Nuxt trees.

Goals:

- **Fast feedback** — lint the full monorepo in seconds, suitable for CI and pre-commit.
- **Single style baseline** — consistent rules across `apps/web` and `apps/cms`.
- **pnpm catalog alignment** — pin `oxlint`, `oxfmt`, `@nuxt/eslint-plugin` next to `nuxt`, `typescript`, etc.
- **Full ESLint replacement** — no dual linter; type correctness stays with `nuxt typecheck` ([ADR-004](./adr-004-typescript-6.md)).

## Decision

1. Adopt **[oxlint](https://oxc.rs/docs/guide/usage/linter)** for linting and **[oxfmt](https://oxc.rs/docs/guide/usage/formatter)** for formatting.

2. **Migrate from `@nuxt/eslint` flat configs** using `@oxlint/migrate` on each app’s `eslint.config.mjs` (see [oxlint-migration-report.md](./oxlint-migration-report.md)):
   - **199 rules** migrated per app
   - **103 rules** skipped (mostly Vue template parsing → not yet in oxlint; stylistic → oxfmt)
   - **Shared rules** at repo root; **per-app globals** for Nuxt auto-imports

3. **Configuration layout:**

   | File | Purpose |
   |------|---------|
   | `.oxlintrc.json` | Shared rules, overrides, 315 shared Nuxt globals, `jsPlugins: [@nuxt/eslint-plugin]` |
   | `.oxfmtrc.json` | Format style (`semi: false`, `singleQuote`, `trailingComma: es5`) |
   | `apps/*/.oxlintrc.json` | `extends` root + app-specific auto-import globals |

4. **Removed:** `@nuxt/eslint`, `eslint`, all `eslint.config.mjs` files.

5. **Retained:** `@nuxt/eslint-plugin` only as an oxlint `jsPlugin` for Nuxt-specific rules (`@nuxt/prefer-import-meta`, page meta, config key order).

6. **Scripts** (root + each app):

   ```json
   "lint": "oxlint .",
   "lint:fix": "oxlint --fix .",
   "fmt": "oxfmt --write .",
   "fmt:check": "oxfmt --check ."
   ```

## Consequences

### Positive

- **Speed** — oxlint is significantly faster than ESLint on Vue + TypeScript monorepos.
- **No dual linter** — developers and CI use one tool.
- **Documented migration** — skipped rules and globals split are recorded.

### Negative / trade-offs

- **~80 Vue template rules** not migrated — template validation relies on Vue compiler + `typecheck`.
- **No type-aware oxlint** — `pnpm typecheck` is the type gate.
- **Large globals blocks** per app — Nuxt auto-import surface; unavoidable until oxlint improves globals inference.

### Follow-ups

- Wire `pnpm lint && pnpm fmt:check && pnpm typecheck` into CI
- Re-run `@oxlint/migrate` when Nuxt ESLint config changes materially (before deleting ESLint again)
