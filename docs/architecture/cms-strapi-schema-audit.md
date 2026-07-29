# CMS ↔ Strapi schema audit

**Status:** Reference (2026-07-12)  
**Sources:** Live Strapi API (`admin.journalducuistot.fr`), `apps/cms/server/db/schema/*`, `apps/web/app/types/strapiMeta.d.ts`, [`IMPLEMENTATION_PLAN.md`](../../IMPLEMENTATION_PLAN.md)

Audit performed after Drizzle v1 migration. Validates that the custom CMS schema matches Strapi v5 content types and what `apps/web` consumes over HTTP.

## Summary

| Area | Verdict |
|------|---------|
| Overall schema shape | ~90% aligned |
| Critical bug | `articles.category_id` points at **recipe** `categories`, not `category_articles` |
| Page body storage | **Markdown string** — dynamic zones not stored (see [ADR-005](./adr-005-page-content-markdown-not-dynamic-zones.md)) |
| API responses | CMS returns raw Drizzle rows; web expects Strapi-shaped JSON — **serializer layer still needed** (covers, etc.) |

---

## Collection mapping

| Strapi collection | CMS table | Notes |
|-------------------|-----------|-------|
| `articles` | `articles` | Columns match; category FK wrong (below) |
| `recipes` | `recipes` | OK |
| `pages` | `pages` | OK; `content` = markdown text, not zone JSON |
| `categories` | `categories` | Recipe categories; `img` → `category_blobs` + `blobs` |
| `category-articles` | `category_articles` | OK table; not linked from `articles` today |
| Media | `blobs`, `category_blobs` | Different response shape vs Strapi `Cover` |
| SEO | `seo`, `social_meta` | Nullable FKs per content type |
| Components | `ingredients`, `nutrition`, `reviews` | OK for recipes |
| `tags` | — | Not present in live Strapi payloads; omit |
| Auth | `users` | CMS-only |

---

## Critical: article category FK

**Strapi:** articles relate to **`category-articles`** (`/api/category-articles`).

```json
"category": {
  "id": 27,
  "name": "Inspiration Culinaire",
  "slug": "inspiration-culinaire"
}
```

**Recipes** relate to **`categories`** (recipe categories, with `locale`, `desc`).

**CMS today:** `articles.category_id` is wired in `relations.ts` to `categories` (recipe categories). That breaks blog URLs `/blog/:category/:slug`.

**Intended (per implementation plan):** `articles.category_id` → `category_articles.id`.

**Fix:** schema + `defineRelations` + migration.

---

## Field audit by content type

### Articles

| Strapi | CMS | Status |
|--------|-----|--------|
| `title`, `content`, `slug` | ✓ | OK — `content` is markdown |
| `cover` | `cover_blob_pathname` → `blobs` | Needs serializer → Strapi `Cover` |
| `category` | `category_id` | **Wrong table** |
| `seo` | `seo.article_id` | OK |
| `publishedAt`, `updatedAt`, `firstPublishedAt`, `locale` | ✓ | OK |
| `documentId`, `localizations` | — | Migration metadata; use `legacy_strapi_map` or columns |
| `categories` (plural) | — | Strapi often `null`; web uses `category` for routing |

### Recipes

Live Strapi keys match CMS: `title`, `intro`, `step`, `slug`, `difficulty`, `time`, `cover`, `category`, `ingredients`, `nutrition`, `seo`, `reviews`, `firstPublishedAt`, `locale`.

- **Ingredients:** `{ name, qty, unit }` with units `g`, `l`, `none`, … — matches CMS enum.
- **Nutrition:** `lipides`, `proteine`, `sucre`, `calories`, `glucides`, `sodium` — matches CMS.

### Pages

| Strapi | CMS | Status |
|--------|-----|--------|
| `name`, `title`, `slug` | ✓ | OK |
| `content` (zone array in Strapi) | `content` (text) | **Store markdown only** — [ADR-005](./adr-005-page-content-markdown-not-dynamic-zones.md) |
| `seoMeta` | `seo.page_id` | OK; relation alias `seoMeta` in queries |
| `parent` | `parent_id` | OK (self-FK) |
| Publishing / locale fields | ✓ | OK |

Strapi zone blocks (`ui.text`, `ui.grid`, …) are **not** persisted in CMS. Convert to markdown on extract.

### Categories (recipes)

Strapi: `name`, `desc`, `slug`, `locale`, `img` (media array).  
CMS: `categories` + `category_blobs` junction — sound; serialize `img` as `Cover[]` for web.

### Category-articles

Strapi: `name`, `slug`, timestamps. CMS table includes `locale`, `status`, etc. — fine. Must be the article category target (see critical bug above).

### SEO / social

- Pages: `seoMeta` object with `description`, `keywords`, `metaRobots`.
- Articles/recipes: `seo` often `[]` when empty; web accepts object or array.
- CMS: `seo` + `social_meta` tables cover this.

---

## API response shape (web compatibility)

CMS handlers return **Drizzle rows** (`paginateResult` / direct select). Web (`strapiMeta.d.ts`, `useFormatUrlCover`, raw `$fetch` on some routes) expects **Strapi-shaped JSON**.

| Web expects | CMS returns today | Action |
|-------------|-------------------|--------|
| `cover: { url, hash, ext, formats, alternativeText, … }` | Blob row or pathname | Add `server/utils/serialize/toCover.ts` (or similar) |
| `content: string` (articles/pages) | ✓ string | OK once pages use MDC/Comark on web |
| `content: StrapiContentBlock[]` (pages, legacy) | string | **Drop** — migrate web to MDC ([ADR-005](./adr-005-page-content-markdown-not-dynamic-zones.md)) |
| `seo` / `seoMeta` | nested object | Minor: empty array vs null |
| `populate=*`, `filters[slug][$eq]` | `include=`, `slug=` | Extend adapter or CMS query parsing |
| `category.name` | ✓ | Recipe `Card.vue` uses `category.title` — **web bug** (Strapi has `name`) |

---

## Correctly architected (no change)

- Split `categories` vs `category_articles` tables
- Nullable SEO FKs (`article_id` / `recipe_id` / `page_id`) instead of polymorphic relations
- i18n: `UNIQUE(slug, locale)` + `locale_group_id`
- Publishing: `status`, `published_at`, `scheduled_at`, `first_published_at`, `deleted_at`
- Recipe components: ingredients, nutrition (1:1), reviews
- Page hierarchy via `parent_id`
- Media metadata in `blobs`; gallery via `category_blobs`

---

## Priority backlog

| Priority | Item |
|----------|------|
| **P0** | Fix `articles.category_id` → `category_articles` |
| **P0** | Strapi response serializers (`cover`, nested relations) on CMS read routes |
| **P1** | Web: page routes → `<MDC>` / Comark; `Page.content: string` |
| **P1** | Strapi extract: zone → markdown for pages |
| **P2** | `legacy_strapi_map` for `documentId` during migration |
| **P2** | Normalize raw Strapi `$fetch` URLs on web to CMS adapter |
| **P3** | `tags`, `surround`, `prev`/`next` — not in live Strapi data |

---

## Related docs

- [ADR-005: Page content as markdown](./adr-005-page-content-markdown-not-dynamic-zones.md)
- [ADR-002: Schemas in CMS only](./adr-002-schemas-in-cms-not-shared-package.md)
- [Overview](./overview.md)
- [Implementation plan](../../IMPLEMENTATION_PLAN.md) — Strapi extract, Comark, serializer tasks
