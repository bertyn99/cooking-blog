# cooking-blog — Nuxt 3 Frontend

## OVERVIEW
SSR cooking blog frontend (Journal du Cuistot). Nuxt 3.19 with Nuxt 4 compat, Tailwind CSS, Strapi CMS integration, full SEO stack.

## STRUCTURE
```
cooking-blog/
├── app/                    # Main app dir (Nuxt 4 structure)
│   ├── components/         # Vue components by domain
│   │   ├── prose/          #   MDC prose overrides (ProsePre, ProseImg, Callout, Mermaid, Grid)
│   │   ├── strapi/ui/      #   Strapi dynamic zone renderers (grid, image, video, banner, quote, etc.)
│   │   ├── recipe/         #   Recipe display (Card, List, Ingredients, Steps, Nutritional, Reviews)
│   │   ├── section/        #   Page sections (Hero, Footer, Sidebar, Newsletter, Popular*, Recent*)
│   │   ├── article/        #   Article display (Card, List)
│   │   ├── preview/        #   Preview renderers (RecipeDisplay, ArticleDisplay)
│   │   ├── base/           #   Shared UI (Pagination, checkbox, content/display)
│   │   ├── comment/        #   Comment form
│   │   └── OgImage/        #   OG image generation template
│   ├── composables/        # Auto-imported composables
│   ├── pages/              # File-based routing
│   ├── layouts/            # default.vue, content.vue
│   ├── plugins/            # mermaid.client.ts, strapi.client.ts
│   ├── types/              # TypeScript declarations
│   ├── utils/              # redirect.ts, format.ts
│   ├── providers/          # Custom Nuxt Image provider (localImageSharp)
│   └── assets/             # CSS, static JSON
├── server/                 # Nitro server
│   ├── api/                #   Sitemap URL resolver, sitemap-ia
│   ├── routes/             #   RSS feed, blog/[slug] API
│   └── utils/              #   (empty)
└── public/                 # Static assets (img/, robots.txt)
```

## WHERE TO LOOK
| Task | File/Dir | Notes |
|------|----------|-------|
| Add a page route | app/pages/{path}.vue | Nuxt auto-routing |
| Add a Strapi dynamic zone block | app/components/strapi/ui/{block}.vue | Must match Strapi component name |
| Add a prose override | app/components/prose/Prose*.vue | Global components (excluded from auto-import pathPrefix) |
| Add a recipe component | app/components/recipe/{Name}.vue | Ingredients/, Steps/ are sub-dirs with index + Element |
| Change SEO meta | app/composables/useLoadMeta.ts | Centralized meta generation with defaults |
| Change reading time calc | app/composables/useReadingTime.ts | 265 WPM French text |
| Modify markdown rendering | app/composables/useMarked.ts | Wraps `marked` lib |
| Add a redirect | app/utils/redirect.ts → routeRules in nuxt.config.ts | Object of {path: {redirect: {to, statusCode}}} |
| Change cache/ISR timing | nuxt.config.ts routeRules | Per-route ISR in seconds |
| Add server API endpoint | server/api/ or server/routes/ | Nitro auto-imports |
| Change image processing | app/providers/localImageSharp.ts | Custom Nuxt Image provider, base URL /uploads/ |
| Modify sitemap | nuxt.config.ts sitemap section | 3 sitemaps: pages, blog, recipes |
| Change Tailwind theme | tailwind.config.ts | Minimal config — typography plugin, font faces |

## CONVENTIONS
- **Components are global**: prose/ components registered globally (pathPrefix: false, global: true). Others use Nuxt auto-import.
- **Strapi v5 integration**: `@nuxtjs/strapi` v2 with prefix `/api`, cookie-based auth (strapi_jwt)
- **MDC components**: `@nuxtjs/mdc` for markdown rendering with prose overrides
- **Schema.org**: `@nuxtjs/seo` + manual `useSchemaOrg` in app.vue (WebSite, Breadcrumb, Organization)
- **OG images**: Custom `Cooking` component, applied globally via routeRules `/*/**`
- **Types**: Strapi meta types in `app/types/strapiMeta.d.ts`, custom meta types in `app/types/meta.ts`
- **No TypeScript strict mode**: tsconfig is standard Nuxt defaults

## ANTI-PATTERNS (THIS PROJECT)
- `useFetchContent` composable is declared but has no return statement — broken/unused
- `tailwind.config.ts` content paths still reference old root-level directories (not app/) — may miss classes in app/ components
- Tailwind uses `module.exports` (CJS) while rest of project uses ESM
- `useGenerateSchemaArianne` breadcrumb composable generates `path` key but schema expects `item`

## COMMANDS
```bash
pnpm dev           # Dev server (no HTTPS)
pnpm build         # Production build (SSR)
pnpm generate      # Static site generation
pnpm preview       # Preview production build
```

## NOTES
- Redis required in production (Nitro cache storage). Config: `process.env.REDIS_URL`
- Strapi URL from `STRAPI_URL` env var (default: http://localhost:1337)
- Umami analytics: `NUXT_UMAMI_ID` + `NUXT_UMAMI_HOST` env vars
- Site URL from `NUXT_PUBLIC_SITE_URL` env var (default: https://journalducuistot.fr)
- Font loading via CSS (not @nuxtjs/google-fonts — commented out in nuxt.config.ts)
- Partytown configured but Google Ads script commented out
- HTTPS dev server config commented out (requires localhost.pem files present)
