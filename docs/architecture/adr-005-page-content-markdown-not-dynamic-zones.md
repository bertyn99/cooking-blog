# ADR-005: Page content as markdown (not Strapi dynamic zones)

## Status

**Accepted** — 2026-07-12

## Context

Strapi v5 stores CMS page body as a **dynamic zone**: a JSON array of blocks (`{ __component: "ui.text", ... }`, `ui.grid`, `ui.banner`, etc.). The legacy web app renders that shape via `BaseContentDisplay` → `strapi/ui/*`.

During the Strapi → custom CMS migration we evaluated whether to:

1. Preserve dynamic-zone JSON in D1 (`pages.content` as JSON), or
2. Store a single **markdown string** and render rich blocks at display time.

Articles already use pattern (2): markdown in `articles.content`, rendered with `<MDC>` on the blog detail page.

The implementation plan also targets **@comark/nuxt** on web (replacing `@nuxtjs/mdc`); both approaches treat `content` as a **text column** — only the renderer changes.

Strapi dynamic zones do **not** need to survive migration. On import, zone blocks can be flattened to markdown (headings, paragraphs, fenced code, and optional MDC component syntax).

## Decision

1. **`pages.content` is a `text` column holding markdown** (same storage model as articles). No JSON dynamic-zone array in the database.

2. **Do not migrate Strapi `__component` structures** into D1. One-time extract scripts convert Strapi zones → markdown where needed.

3. **Rich layout blocks** (grids, banners, cards, etc.) are expressed as **MDC / Comark components embedded in markdown**, registered under `apps/web/app/components/prose/` (or Comark equivalents after T14). Example:

   ```md
   # Page title

   Intro paragraph…

   ::banner{message="Astuce du chef" background="bg-amber-100"}
   ::
   ```

4. **`strapi/ui/*` and `BaseContentDisplay` are legacy.** They remain only until page routes are switched to `<MDC>` / `<Comark>` (see follow-ups). New page content must not depend on `__component` keys.

5. **CMS API** returns `content` as a plain string. No serializer step is required to rebuild dynamic-zone arrays.

## Consequences

### Positive

- Simpler schema and migrations — one string per page, same as articles.
- Editors work in markdown; preview can use Comark streaming later.
- Drops the `ui.grid` `cells` vs `items` mismatch and other Strapi block quirks.
- Aligns with [`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md) (“Pages store Comark markdown, not JSON dynamic zones”).

### Negative / follow-ups

| Item | Owner | Notes |
|------|-------|-------|
| Switch `[...slug].vue`, `recettes-[category]/index.vue`, preview page route from `BaseContentDisplay` to `<MDC>` / `<Comark>` | `apps/web` | Articles already use `<MDC>` |
| Change `Page.content` type in `strapiMeta.d.ts` from `StrapiContentBlock[]` to `string` | `apps/web` | Types only |
| Strapi extract: `pages.ts` converter zone → markdown | `apps/cms` | One-time migration task |
| Port still-needed zone UIs to `prose/` MDC components | `apps/web` | Only if content uses them post-conversion |
| Remove `strapi/ui/*` + dispatcher when unused | `apps/web` | Cleanup after routes migrated |

### Out of scope

- Recipe and article bodies were already markdown — unchanged.
- SEO, parent hierarchy, slug/locale fields on pages — unchanged (see [CMS ↔ Strapi schema audit](./cms-strapi-schema-audit.md)).

## References

- Live Strapi page sample: `content` as `[{ __component: "ui.text", ... }, …]` at `admin.journalducuistot.fr`
- CMS schema: `apps/cms/server/db/schema/pages.ts` — `content: text('content')`
- Web article MDC: `apps/web/app/pages/blog/[category]/[slug].vue`
- Web page (legacy zones): `apps/web/app/pages/[...slug].vue`
