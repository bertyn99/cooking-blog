# ADR-007: Page builder (Comark sections + CMS canvas)

## Status

**Accepted** — 2026-09-18

## Context

CMS pages store markdown in `pages.content` ([ADR-005](./adr-005-page-content-markdown-not-dynamic-zones.md)). Marketing sections (hero, newsletter, recipe/article lists) were hardcoded on `apps/web` homepage only.

## Decision

1. **Section blocks** are Comark components (`::hero`, `::newsletter`, `::recipe-list`, `::article-list`) with inline attributes only — no Comark `binding()` on stored content.

2. **`PageMarkdown`** renderer (extends `ArticleMarkdown`) registers section SFCs under `apps/web/app/components/blocks/`; article/recipe routes use `ArticleMarkdown` only.

3. **CMS** owns a Vue-free catalog + `PageDocument` parse/serialize in `apps/cms/shared/content-blocks/`. The admin **PageWorkspace** offers canvas + markdown editor views; default view is `editor.pageDefaultView` in `site_settings` (default `editor`).

4. **`pages.is_home`** designates the published homepage per locale; public URL remains `/` via `apps/web/app/pages/index.vue`.

5. **Web types** for pages use `apps/web/app/types/cms.ts` (HTTP payload), not `strapiMeta.d.ts`.

6. **Public CMS client** is Nuxt `$fetch.create` (`plugins/cms.ts`) with query keys that match CMS GET handlers (`slug`, `slugs`, `isHome`, `include`, `page`, `pageSize`). No Strapi filter translator.

## Consequences

- Homepage content editable in CMS after `ensure-home-page` seed.
- List blocks fetch via `useAsyncData` inside Comark SFCs (explicit cache keys).
- Legacy Strapi zone rendering remains in `BaseContentDisplay` but is not used for new pages.
