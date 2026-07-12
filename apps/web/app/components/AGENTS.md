# COMPONENT ARCHITECTURE — app/components/

58 `.vue` files across 11 subdirs + root. **Auto-imported by Nuxt** (no manual imports needed) except `prose/` which uses `global: true` registration.

## STRUCTURE

```
components/
├── section/             # Page layout sections (12) — header, footer, sidebar, hero, lists
├── strapi/ui/           # Strapi dynamic zone components (11) — kebab-case, map to __component keys
├── prose/               # MDC prose overrides (6) — globally registered, Prose* prefix = built-in override
├── recipe/              # Recipe domain (5 + Ingredients/ + Steps/)
│   ├── Ingredients/     # index.vue + Element.vue
│   └── Steps/           # index.vue + Content.vue
├── article/             # Article domain (2): Card, List
├── base/                # Primitives: Pagination, content/display (zone dispatcher), input/checkbox
├── preview/             # Strapi preview variants: RecipeDisplay, ArticleDisplay
├── comment/             # Form (no backend wired)
├── OgImage/             # Cooking.vue — OG image template for @nuxtjs/seo
└── *.vue (root)         # 11 root components — mix of legacy Storyblok + shared utilities
```

## WHERE TO LOOK

| Task | Go to |
|------|-------|
| Render a Strapi dynamic zone | `base/content/display.vue` — dispatcher maps `__component` strings (e.g. `ui.text`) to `strapi/ui/*` components |
| Add a new Strapi UI component | `strapi/ui/{name}.vue` kebab-case + register in `base/content/display.vue` |
| Override MDC prose element | `prose/Prose{Name}.vue` — overrides built-in (`ProsePre`, `ProseImg`) |
| Add custom MDC block | `prose/{Name}.vue` (no `Prose` prefix) — e.g. `Grid`, `Callout`, `Mermaid` |
| Recipe ingredient rendering | `recipe/Ingredients/index.vue` + `Element.vue` (includes `SchemaOrgRecipe`) |
| Recipe step rendering | `recipe/Steps/index.vue` + `Content.vue` (includes `SchemaOrgRecipe`) |
| Article/recipe card | `article/Card.vue`, `recipe/Card.vue` — both consume Strapi cover via `useFormatUrlCover` |
| OG image template | `OgImage/Cooking.vue` — referenced in `routeRules` default OG image |
| Preview mode display | `preview/RecipeDisplay.vue`, `preview/ArticleDisplay.vue` — full detail render without page shell |

## NAMING (CONVENTION SPLIT)

| Directory | Convention | Examples |
|-----------|------------|----------|
| `section/`, `recipe/`, `article/`, `preview/`, `comment/`, `OgImage/`, root | **PascalCase** | `HeroArticle.vue`, `RecipeIngredients/index.vue` |
| `strapi/ui/`, `base/content/`, `base/input/` | **kebab-case** | `text.vue`, `code-block.vue`, `display.vue` |
| `prose/` | Mixed — `Prose` prefix = MDC built-in override | `ProsePre.vue`, `Grid.vue`, `Mermaid.vue` |

## STRAPI DYNAMIC ZONE — strapi/ui/ → __component map

| File | Strapi `__component` | Purpose |
|------|----------------------|---------|
| `text.vue` | `ui.text` | MDC-rendered rich text |
| `image.vue` | `ui.image` | `<img>` with caption |
| `video.vue` | `ui.video` | iframe embed |
| `banner.vue` | `ui.banner` | Colored message banner |
| `button.vue` | `ui.button` | CTA link button |
| `card.vue` | `ui.card` | Title + content card |
| `code-block.vue` | `ui.code-block` | `<pre><code>` block |
| `divider.vue` | `ui.divider` | `<hr>` |
| `gallery.vue` | `ui.gallery` | Image grid 2-4 cols |
| `grid.vue` | `ui.grid` | Generic 1-2 col grid of items |
| `quote.vue` | `ui.quote` | Blockquote with optional author |

The dispatcher is `base/content/display.vue` — it reads `__component` and renders the matching `strapi/ui/*` component. Article/recipe bodies (CMS-managed) flow through this dispatcher.

## ANTI-PATTERNS

- **Legacy Storyblok components** (no module installed, will crash if rendered): `Page.vue`, `Teaser.vue`, `Feature.vue`, `AllArticles.vue`, `df.vue`, `section/Grid.vue`, `section/PopularRecipes.vue`. These use `v-editable`, `blok` props, `StoryblokComponent`. **Do not wire into active routes.**
- **`PreCarrousel.vue`** is an empty placeholder — do not assume it renders anything.
- **`comment/Form.vue`** has no backend wired — form submission is a no-op.
- **Some files manually import auto-imported composables** (`useReadingTime`, `useMarked`, `useFormatUrlCover`) — inconsistent but harmless.
- **`"meidum"` typo** in `CustomImage.vue:23` and `article/Card.vue:39` — uses `"meidum"` instead of `"medium"`. Medium-size image lookups silently fail.
- **Object-based `defineProps({...})`** in legacy components (`df.vue`, `Filter.vue`, `CustomImage.vue`, `article/Card.vue`) — new components must use type-based `defineProps<{...}>()`.

## NOTES

- **`prose/` registration**: excluded from default component scan, re-registered with `global: true` in `nuxt.config.ts`. Enables MDC overrides + custom blocks for markdown content.
- **`ProsePre.vue`** routes `mermaid` language blocks to the `Mermaid.vue` component (via `$mermaid` plugin).
- **`OgImage/Cooking.vue`** is the site-wide OG image template — amber-themed SVG with logo + title + description. Referenced in `routeRules` `"/*/**": { ogImage: { component: "Cooking" } }`.
- **Lazy loading**: components used with `Lazy` prefix (`LazyRecipeSteps`, `LazySectionFooter`, `LazyCta`) for below-the-fold rendering.
