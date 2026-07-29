# Oxlint migration report — `@nuxt/eslint` → full Oxlint

**Date:** 2026-07-12  
**Tool:** [`@oxlint/migrate`](https://github.com/oxc-project/oxlint-migrate) v1.x  
**Source configs:** `apps/cms/eslint.config.mjs` and `apps/web/eslint.config.mjs` (Nuxt-generated flat config via `withNuxt()`)

## Summary

| App | ESLint rules migrated | Skipped | Globals |
|-----|----------------------|---------|---------|
| `apps/cms` | **199** | 103 | 390 (75 CMS-only after dedup) |
| `apps/web` | **199** | 103 | 624 (309 web-only after dedup) |
| **Shared (root)** | rules + 4 overrides | — | **315** Nuxt/Vue auto-imports |

**Outcome:** ESLint removed from both apps. Linting is **oxlint-only**. Formatting is **oxfmt** (the `@stylistic/*` override block from ESLint was **not** migrated — stylistic rules belong to the formatter).

## Migration command

```bash
# CMS (after nuxt prepare)
npx @oxlint/migrate apps/cms/eslint.config.mjs \
  --output-file apps/cms/.oxlintrc.migrated.json \
  --details

# Web (temporary @nuxt/eslint module for one-off migration)
npx @oxlint/migrate apps/web/eslint.config.mjs \
  --output-file apps/web/.oxlintrc.migrated.json \
  --details
```

## Config layout (post-merge)

```
.oxlintrc.json              # Shared rules, overrides, 315 shared globals, jsPlugins
.oxfmtrc.json               # Formatting (replaces @stylistic/eslint-plugin)
apps/cms/.oxlintrc.json     # extends root + 75 CMS server auto-import globals
apps/web/.oxlintrc.json     # extends root + 309 web auto-import globals
```

`jsPlugins` retained for Nuxt-specific rules:

- `@nuxt/eslint-plugin` — `@nuxt/prefer-import-meta`, page meta, `nuxt.config` key order

## Rules not migrated (103 per app)

Categories from `--details`:

| Category | Count | Notes |
|----------|-------|-------|
| **Vue template parsing** | ~80 | `vue/valid-v-*`, `vue/html-*`, attribute order, etc. — oxlint cannot parse `.vue` templates yet |
| **Stylistic** | ~15 | Delegated to **oxfmt** (`comma-dangle: never`, `semi: never`, single quotes) |
| **Not implemented** | 9 | e.g. `vue/multi-word-component-names`, `vue/no-mutating-props` |
| **Nursery** | 1 | `no-undef` (use globals + `typescript/no-unused-vars` instead) |
| **Superseded** | 2 | `no-dupe-args`, `no-octal` (strict mode) |

### Acceptable gaps

- **Template-only Vue rules** — runtime Vue compiler catches most template errors; `nuxt typecheck` covers script blocks.
- **Stylistic** — `pnpm fmt` / `pnpm fmt:check` enforce style instead of lint rules.
- **Type-aware ESLint rules** — use `pnpm typecheck` (`vue-tsc` + TS 6), not oxlint type-aware mode (not enabled).

## Removed packages

From both `apps/cms` and `apps/web`:

- `@nuxt/eslint`
- `eslint`
- `eslint.config.mjs`

## Retained dependency

- `@nuxt/eslint-plugin` (catalog) — loaded via oxlint `jsPlugins` for Nuxt-specific rules only.

## CI recommendation

```bash
pnpm lint          # oxlint both apps
pnpm fmt:check     # oxfmt both apps
pnpm typecheck     # nuxt typecheck both apps (TS 6)
```

## References

- [ADR-003](./adr-003-oxlint-oxfmt-tooling.md)
- [ADR-004](./adr-004-typescript-6.md)
- [Oxlint config](https://oxc.rs/docs/guide/usage/linter/config.html)
- [migrate-oxlint skill](https://github.com/oxc-project/oxlint-migrate)
