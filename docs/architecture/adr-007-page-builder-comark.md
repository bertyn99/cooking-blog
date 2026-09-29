# ADR-007: Page builder (Comark sections + CMS canvas)

## Status

**Accepted** — 2026-09-18 · **Amended** — 2026-09-29 (shared module)

## Context

CMS pages store markdown in `pages.content` ([ADR-005](./adr-005-page-content-markdown-not-dynamic-zones.md)). Marketing sections (hero, newsletter, recipe/article lists) were hardcoded on `apps/web` homepage only. The same Comark blocks were then copied into the CMS Aperçu, so Client / Editor / Simple views drifted.

## Decision

1. **Section blocks** are Comark components (`::hero`, `::newsletter`, `::recipe-list`, `::article-list`) with inline attributes only — no Comark `binding()` on stored content. Prose MDC (`::grid`, `::callout`) and native markdown (image, link, quote) share the same catalog.

2. **One package, three views.** `@journalducuistot/shared` is a Nuxt **module** (`jdcContent.surfaces`: web `client`, CMS `client`+`editor`+`simple`). Both apps load `@nuxt/ui`. Client views match journalducuistot.fr (light public surface, yellow CTA, 3/4 recipe cards). Canvas **Editors** for sections live in the package. Parse lifts section tags, `::grid` / `::callout`, and markdown images.

   **Studio-style schema.** Each catalog entry owns typed `fields` (text / media / select / number / color, with `visibleWhen`) and named `slots` (`# DEFAULT`). The canvas inspector is a generated form (`BlockPropsForm`). Vue simple is a collapsible Studio tree (`UCollapsible`): chevron, label, `N prop` badge, and input-kind chips (Média, Texte, Liste, …). Comark `#slot-name` templates parse into `SectionBlock.slots`. TipTap node views remain the markdown editor for grid / callout / image.

3. **`PageMarkdown` / CMS Aperçu** both consume `buildContentBlockClients()`. Article/recipe routes use `ArticleMarkdown` (callout + grid only).

4. **CMS** page-builder canvas renders each section’s **Simple** view. UEditor NodeViews for grid / callout / image are the **Editor** views. Default view is `editor.pageDefaultView` in `site_settings` (default `editor`).

5. **`pages.is_home`** designates the published homepage per locale; public URL remains `/` via `apps/web/app/pages/index.vue`.

6. **Web types** for pages use `apps/web/app/types/cms.ts` (HTTP payload), not `strapiMeta.d.ts`.

7. **Public CMS client** is Nuxt `$fetch.create` (`plugins/cms.ts`) with query keys that match CMS GET handlers (`slug`, `slugs`, `isHome`, `include`, `page`, `pageSize`). List blocks fetch through app-overridden `useContentBlockRecipeList` / `useContentBlockArticleList`.

## Consequences

- Homepage content editable in CMS after `ensure-home-page` seed.
- Adding a block means adding `packages/shared/blocks/{tag}/{Client,Editor,Simple}.vue` + a catalog row — not a CMS copy and a web copy.
- Legacy Strapi zone rendering remains in `BaseContentDisplay` but is not used for new pages.
