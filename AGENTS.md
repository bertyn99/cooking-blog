# cooking-blog — Nuxt 3 Frontend (Journal du Cuistot)

## OVERVIEW
French cooking blog (journalducuistot.fr, FR-FR). **Nuxt 3.17 with `compatibilityVersion: 4`** (Nuxt 4 `app/` dir layout) + **Strapi v5** headless CMS at `admin.journalducuistot.fr`. SSR-first with ISR caching backed by Vercel KV (Redis). Tailwind CSS, MDC rendering, `@nuxtjs/seo` (sitemap/OG/schema-org).

## STRUCTURE
```
cooking-blog/
├── app/                    # 🌟 ALL app source (Nuxt 4 compat mode — ~/ resolves here)
│   ├── components/         # → see app/components/AGENTS.md
│   │   ├── prose/          #   MDC prose overrides (global: true, excluded from default scan)
│   │   ├── strapi/ui/      #   Strapi dynamic zone renderers (kebab-case, map to __component)
│   │   ├── recipe/         #   Recipe display (Card, List, Ingredients/, Steps/, Nutritional, Reviews)
│   │   ├── section/        #   Page sections (Hero, Footer, Sidebar, Newsletter, Popular*, Recent*)
│   │   ├── article/        #   Article display (Card, List)
│   │   ├── preview/        #   Preview renderers (RecipeDisplay, ArticleDisplay)
│   │   ├── base/           #   Shared UI (Pagination, checkbox, content/display zone dispatcher)
│   │   ├── comment/        #   Comment form (no backend wired)
│   │   └── OgImage/        #   OG image generation template (Cooking.vue)
│   ├── composables/        # 6 auto-imported (useLoadMeta, useReadingTime, useFormatCover, useComark, useGenerateSchemaArianne, useFetchContent[DEAD])
│   ├── pages/              # File-based routing — 8 routes, 3 content silos
│   ├── layouts/            # default.vue (list pages), content.vue (detail w/ sidebar + comments)
│   ├── plugins/            # mermaid.client.ts ($mermaid provide), strapi.client.ts (error toast)
│   ├── types/              # strapiMeta.d.ts (HAND-WRITTEN Strapi types), meta.ts (SEO), index.d.ts ($mermaid augment)
│   ├── utils/              # redirect.ts (301 map → routeRules), format.ts (slug hierarchy)
│   ├── providers/          # localImageSharp.ts — custom @nuxt/image provider for Strapi uploads
│   └── assets/css/         # Tailwind entry (index.css)
├── server/                 # Nitro — see server/AGENTS.md
│   ├── api/__sitemap__/    #   Sitemap URL source (fetches Strapi)
│   ├── api/sitemap-ia.ts   #   AI-oriented grouped routes JSON
│   ├── routes/blog/        #   Legacy /blog/:slug → /blog/:category/:slug (301)
│   └── routes/rss.xml.ts   #   RSS feed
├── public/img/             # logo.webp, hero.jpg, author.jpg
├── nuxt.config.ts          # 🌟 Central config — modules, ISR rules, Strapi, sitemap, Redis cache
├── tailwind.config.ts      # ⚠️ STALE content paths + wrong `FontFace` key (should be fontFamily)
├── app.config.ts           # Minimal (umami version flag)
├── app.vue                 # Root: NuxtLayout+NuxtPage, schema.org defaults
├── error.vue               # 404/error page
└── .env                    # STRAPI_URL, REDIS_URL, NUXT_UMAMI_*, NUXT_PUBLIC_SITE_URL
```

## WHERE TO LOOK
| Task | File/Dir | Notes |
|------|----------|-------|
| Add a page route | `app/pages/{path}.vue` | Detail pages must call `definePageMeta({ layout: "content" })` |
| Add/find a component | `app/components/` | See `app/components/AGENTS.md` for the 11-subdir map |
| Add a Strapi dynamic zone block | `app/components/strapi/ui/{block}.vue` + register in `base/content/display.vue` | Must match Strapi `__component` name (kebab-case) |
| Add a prose override | `app/components/prose/Prose*.vue` | Global components (excluded from auto-import pathPrefix) |
| Change SEO defaults | `app/composables/useLoadMeta.ts` | All pages call `useSeoMeta(useLoadMeta({...}))` |
| Change reading time calc | `app/composables/useReadingTime.ts` | 265 WPM French text |
| Modify markdown rendering | `app/composables/useComark.ts` | Wraps `@comark/html` |
| Add a 301 redirect | `app/utils/redirect.ts` → routeRules in nuxt.config.ts | Object of `{path: {redirect: {to, statusCode}}}` |
| Change cache/ISR timing | `nuxt.config.ts` routeRules | Per-route ISR in seconds (homepage=15m, blog=25m, uploads=5d, sitemap=1d, rss=3d) |
| Add server API endpoint | `server/api/` or `server/routes/` | Nitro auto-imports |
| Change image processing | `app/providers/localImageSharp.ts` | Custom Nuxt Image provider, Sharp-style modifiers |
| Update Strapi types | `app/types/strapiMeta.d.ts` | **Hand-written, no codegen** — update manually when schema changes |
| Modify sitemap | `nuxt.config.ts` sitemap section + `server/api/__sitemap__/urls.ts` | 3 sitemaps: pages, blog, recipes |
| Change Tailwind theme | `tailwind.config.ts` | ⚠️ Content paths stale (reference root not app/) |
| Route path generation | `app/utils/format.ts` `generateSlug()` | Recursive parent hierarchy for CMS pages |
| Image URL | `useFormatUrlCover(cover, size?)` | Never raw Strapi URLs — use composable or `localImageSharp` provider |

## CODE MAP

### Routes (`app/pages/`)
| Route | File | Layout | Notes |
|-------|------|--------|-------|
| `/` | `index.vue` | default | ISR 15m — last 5 articles + 4 recipes |
| `/blog` | `blog/index.vue` | default | Paginated 7/page, category filter |
| `/blog/:category/:slug` | `blog/[category]/[slug].vue` | content | MDC render, SchemaOrgArticle |
| `/recette` | `recette/index.vue` | default | Paginated 16/page |
| `/recette/:slug` | `recette/[slug].vue` | content | SchemaOrgRecipe |
| `/recette/recettes-:category` | `recette/recettes-[category]/index.vue` | content | Category CMS page |
| `/:slug+` (catch-all) | `[...slug].vue` | content | Hierarchical Strapi pages |
| `/preview` | `preview.vue` | content | Draft preview (`?slug=&type=`), `noindex` |

### Server endpoints (see `server/AGENTS.md`)
- `GET /api/__sitemap__/urls` — sitemap source (3-group `_sitemap` field)
- `GET /api/sitemap-ia` — AI-readable JSON route index
- `GET /rss.xml` — RSS feed (pages+articles+recipes)
- `GET /blog/:slug` — 301 redirect to `/blog/:category/:slug`

### Key symbols
| Symbol | Location | Role |
|--------|----------|------|
| `generateSlug(str, parent)` | `app/utils/format.ts` | Recursive slug builder for nested Strapi pages |
| `getParentHierarchy(parent)` | `app/utils/format.ts` | Flattens `NestedParent` chain root→leaf |
| `useLoadMeta(opt)` | `app/composables/useLoadMeta.ts` | Builds OG/Twitter/meta object with site defaults |
| `useFormatCover(cover, size?)` | `app/composables/useFormatCover.ts` | Strapi cover URL resolver |
| `useGenerateSchemaArianne(slug)` | `app/composables/useGenerateSchemaArianne.ts` | Breadcrumb schema from slug array |
| `BaseContentDisplay` | `app/components/base/content/display.vue` | Renders Strapi dynamic zones via `__component` → `strapi/ui/*` map |
| `NestedParent`, `Recipe`, `Article`, `Cover`, `SEO` | `app/types/strapiMeta.d.ts` | Mirror Strapi content types |

## CONVENTIONS

### Strapi fetch idiom (every page)
```ts
const { find } = useStrapi();
const { data } = await useAsyncData<T>('cache-key', () =>
  find<T>('collection', {
    filters: { slug: { $eq: route.params.slug } },
    populate: ['cover', 'category', 'seo'],
    pagination: { page: 0, pageSize: 1 },  // ⚠ zero-indexed
  })
);
```
Always wrap `useCms().find()` in `useAsyncData` with a unique cache key. Type every call with the matching type from `~/types/strapiMeta.d.ts`. (`useStrapi` is a deprecated alias.)

### SEO triple-call (every content page)
```ts
useSeoMeta(useLoadMeta({ title, description, image, url }) as any);
useHead({ link: [{ rel: 'canonical', href: '...' }] });
defineOgImageComponent('Cooking', { headline, description });
// Plus <SchemaOrgBreadcrumb :itemListElement="..." /> in template
```

### Page layouts
- Homepage + listings → `default.vue` (header + slot + footer)
- Articles, recipes, CMS pages, preview → `content.vue` (header + 4/5 main + 1/5 sidebar + comments + `<NuxtErrorBoundary>`)

### Other
- **Components are global**: `prose/` registered `global: true` (excluded from default scan, then re-registered). Others use Nuxt auto-import.
- **Strapi v5 integration**: `@nuxtjs/strapi` v2 with prefix `/api`, cookie-based auth (`strapi_jwt`)
- **MDC**: `@nuxtjs/mdc` for markdown rendering with prose overrides
- **Schema.org**: `@nuxtjs/seo` + manual `useSchemaOrg` in `app.vue` (WebSite, Breadcrumb, Organization) + per-page `<SchemaOrgBreadcrumb>` / `<SchemaOrgRecipe>` / `<SchemaOrgArticle>`
- **OG images**: Custom `Cooking` component, applied globally via `routeRules['/*/**'].ogImage`
- **Types**: Hand-written Strapi types in `app/types/strapiMeta.d.ts`, custom meta types in `app/types/meta.ts`
- **No TypeScript strict mode**: tsconfig is standard Nuxt defaults
- **Naming**: composables `usePascalCase`, utils `camelCase`, components PascalCase by domain, `strapi/ui/` + `base/` nested dirs use kebab-case
- **Lazy loading**: `Lazy` prefix for below-the-fold (`LazyRecipeSteps`, `LazySectionFooter`, `LazyCta`)

## ANTI-PATTERNS (THIS PROJECT)

> Codified from `.cursor/rules/nuxt-3-architecture-and-technology-rule.mdc` + `.cursor/rules/nuxt-vue-best-practices-rule.mdc` (both `alwaysApply`).

- **NEVER hard-code env values** — `.cursor/rules` line 15. **Known violations**: `server/api/__sitemap__/urls.ts`, `server/api/sitemap-ia.ts`, `server/routes/rss.xml.ts` all hardcode `https://admin.journalducuistot.fr` instead of `process.env.STRAPI_URL`. Fix when touching these files.
- **NEVER use `<script setup>` without `lang="ts"`** in new components. Legacy violations: `df.vue`, `error.vue`.
- **NEVER use Object-based `defineProps({...})`** — use type-based `defineProps<{...}>()`. Legacy violations: `error.vue`, `df.vue`, `Filter.vue`, `CustomImage.vue`, `article/Card.vue`.
- **NEVER commit `console.log`** — 10 occurrences currently live in `index.vue:61`, `[...slug].vue:19,57`, `blog/index.vue:27`, `recette/[slug].vue:33`, `recettes-[category]/index.vue:41`, `preview.vue:36`, `section/YouMayAlsoLike.vue:26`, `prose/ProsePre.vue:40`, `server/routes/rss.xml.ts:21`.
- **NEVER use `as any` to bypass Strapi typing** — extend `~/types/strapiMeta.d.ts` instead. 10+ violations across `pages/preview.vue` (5x), server sitemap/rss/redirect handlers.
- **DO NOT touch Storyblok code** — `Page.vue`, `Teaser.vue`, `Feature.vue`, `AllArticles.vue`, `df.vue`, `section/Grid.vue`, `section/PopularRecipes.vue` are **legacy from a previous CMS migration** (use `v-editable`, `blok` props, `StoryblokComponent`). Will crash at runtime if rendered. New components must use Strapi patterns.
- **DO NOT use `useFetchContent` composable** — broken (no return statement). Use `useStrapi().find()` + `useAsyncData` instead.
- **"meidum" typo (live bug)** — `app/components/CustomImage.vue:23` and `app/components/article/Card.vue:39` use `"meidum"` instead of `"medium"`. Medium-size image lookups silently fail.
- **`tailwind.config.ts` issues** — content paths reference stale root-level dirs (not `app/`); also uses wrong `FontFace` key (should be `fontFamily`); also `module.exports` (CJS) while project is ESM.
- **`useGenerateSchemaArianne` mismatch** — generates `path` key but schema.org expects `item`.

## UNIQUE STYLES

- **Three-part sitemap** — `nuxt.config.ts` `sitemap.sitemaps` defines `pages`, `blog`, `recipes`. URLs tagged with `_sitemap: 'pages|blog|recipes'` in `server/api/__sitemap__/urls.ts`.
- **Prose component scan exclusion** — `nuxt.config.ts` `components` block: first entry excludes `prose/**`, second re-registers `prose/` as `global: true`. Don't merge.
- **French UI in code** — Recipe route is `recette/` (singular French), components are `recipe/` (English). Comments, content, slugs are French; code identifiers are English.
- **ogImage override** — `routeRules["/*/**"].ogImage` forces `Cooking` component on ALL routes by default. Per-page `defineOgImageComponent('Cooking', {...})` overrides it.
- **`app.vue` carries global schema.org** — `defineWebSite`, `defineOrganization`, `defineBreadcrumb` set once here, not per-page.
- **Image pipeline** — `Strapi /uploads/* → @nuxt-alt/proxy rewrite → localImageSharp provider → <NuxtImg provider="localImageSharp">`. Sharp-style modifiers (`width_800,format_webp`). Provider strips `/uploads/` prefix (baseURL already includes it).
- **`.npmrc`: `shamefully-hoist=true`** — required for pnpm + Nuxt module resolution.
- **Global CSS** (`app/assets/css/index.css`): `--ui-header-height: 24rem`, body uses `bg-neutral-50 font-[catamaran]`, headings use Merriweather with `scroll-mt` calc for sticky header offset.

## COMMANDS
```bash
pnpm install          # shamefully-hoist=true required
pnpm dev              # http://localhost:3000 (HTTP)
pnpm dev-ssl          # ⚠️ Windows-only (uses `set` not `export`)
pnpm build            # Production build
pnpm generate         # Static site generation
pnpm preview          # Preview production build
```

**Required env** (`.env`, NOT tracked by git): `STRAPI_URL`, `REDIS_URL`, `NUXT_UMAMI_ID`, `NUXT_UMAMI_HOST`, `NUXT_PUBLIC_SITE_URL`.

## NOTES

### Gotchas
- **Nuxt 4 compat mode** via `future: { compatibilityVersion: 4 }` — `app/` directory is the source root. `~/` resolves to `app/`. APIs may differ from Nuxt 3 defaults.
- **Strapi v5 + `@nuxtjs/strapi` v2.1.1** — module lags Strapi v5 types, hence `as any` on `populate`.
- **ISR caching** (Redis via `nitro.storage.cache`): `/` 15min, `/blog/**` 25min, `/uploads/**` 5days, `/sitemap.xml` 24h, `/rss.xml` 3days.
- **`@nuxt/image` on `2.0.0-alpha.1`** — pre-release. API may shift.
- **`@vercel/kv` misplaced in `devDependencies`** — actually a runtime dependency for ISR cache.
- **SSL certs tracked in git** — `localhost-key.pem` and `localhost.pem` are committed (should be `.gitignored`). Local-only artifacts.
- **No CI/CD** — no `.github/workflows/`, no `vercel.json`/`netlify.toml`/`wrangler.toml`. Deployment target is **implicitly Vercel** (via `@vercel/kv` + `REDIS_URL` pointing to `vercel-storage.com`).
- **No tests** — zero test files, no vitest/jest/playwright config, no test deps. Greenfield — recommended stack: `vitest` + `@vue/test-utils` + `@nuxt/test-utils`.
- **No middleware** (`app/middleware/` doesn't exist). Auth/guards handled at CDN or via `routeRules`.
- **Strapi collections in use**: `articles`, `recipes`, `pages` (with recursive `parent`), `categories`, `category-articles`.
- **Recipe field casing mismatch**: `Recipe.Intro` and `Recipe.Ingredient` are capitalized in the type (Strapi v5 convention) — don't auto-lowercase.
- **Font loading via CSS** (not `@nuxtjs/google-fonts` — commented out in `nuxt.config.ts`).
- **Partytown configured but Google Ads script commented out**.
- **HTTPS dev server config commented out** (requires `localhost.pem` files present).
- **Editor rules**: `.cursor/rules/` and `.continue/rules/` mirror each other (Nuxt architecture + best practices). Read before major architectural changes.
- **`app.vue:11` has `@todo`** — Schema.org identity selection (Organization vs Person) still pending.

See `app/components/AGENTS.md` for the component domain guide and `server/AGENTS.md` for Nitro routes.
