# SEO audit — Journal du Cuistot

**Date:** 2026-10-06
**Site:** [journalducuistot.fr](https://journalducuistot.fr)
**Period (primary):** last 28 days (2026-09-05 → 2026-10-03, GSC data lag ≈ 3d)
**Sources:** Google Search Console API (performance + URL inspection + sitemaps), jdc-cms prod MCP (live content + SEO rows), [seo-audit-2026-08.md](./seo-audit-2026-08.md) as baseline.
**Verdict:** recovery confirmed. The August production defects (localhost canonicals, noindex, `Disallow: /`) are fixed; key URLs are re-indexed; clicks restarted. The bottleneck moved from **infrastructure** to **content tuning**: missing meta on the proven pages, thin hub, recipe-schema gaps, and one recipe cluster with unanswered demand.

---

## Executive summary

| Signal (28d) | Current | Prior 28d | Δ |
|--------------|---------|-----------|---|
| Clicks | **8** | 0 | ∞ (restart) |
| Impressions | **502** | 616 | −19% (mix shift) |
| CTR | **1.59%** | 0% | restart |
| Avg. position | **50.3** | 79.4 | **+29** |

12-month context: the Oct-2025 peak (171 clicks / 4,825 impressions) collapsed from Nov 2025 (29/584) through Jul 2026 (0 clicks). The rebuild is visible: Aug 1 click, **Sep 6 clicks / 569 impressions**, Oct 1–3 already 107 impressions. Previous baseline doc (2026-10-02 refresh) recorded 6 clicks / 568 impressions / pos 57 — the current window is slightly better on every axis.

**Indexing:** all 5 inspected priority URLs → *Submitted and indexed* (correct canonicals, `INDEXING_ALLOWED`). The Aug audit's 21%-indexation blocker is resolved. Note: GSC sitemap "indexed: 0" counters are stale — trust URL inspection instead.

**Crawl cadence is slow** (lastCrawl 2026-07-30 → 2026-09-23 across inspected URLs): authority is thin; refreshed pages need explicit recrawl pushes (Indexing API / internal links) to compound.

---

## 1. What the traffic says (28d)

### 1.1 Pages

| Page | Clicks | Imp. | CTR | Pos | Read |
|------|--------|------|-----|-----|------|
| `/blog/…/10-delicieuses-recettes-de-plat-aperitif-belge-pour-l-ete` | **4** | 87 | 4.6% | **10.1** | Top asset, recovered (was 0 clicks in Aug) |
| `/blog/…/10-desserts-delicieux-de-la-cuisine-d-afrique-du-nord` | **3** | 114 | 2.6% | 30.5 | Climbing (was pos 33.6, 1 click) |
| `/techniques-culinaires/conservation-aliments` | 1 | 95 | 1.1% | 89.5 | Real demand, ranked far too deep |
| `/recette/moules-marinieres` | 0 | 61 | 0% | 70.8 | Demand exists, page not aligned (see 1.2) |
| `/recette/les-fricadelles` | 0 | 47 | 0% | 55.7 | Nord/Belgium cluster, same story |
| `/recette/crevettes-grises-a-la-biere` | 0 | 25 | 0% | 62.0 | Same cluster |
| `/blog/…/aperitif-portuguais…` | 0 | 25 | 0% | 28.4 | 3rd apéro country with impressions |
| `/techniques-culinaires/methodes-de-cuisson` | 0 | 23 | 0% | 49.7 | Sub-hub surfaced, too thin to rank leaves |
| `/techniques-culinaires/methodes-de-cuisson/guide-friture-maison` | 0 | 1 | — | **10** | Striking distance, no volume yet |
| `/recette/recettes-du-monde` | 0 | 5 | 0% | **7.4** | Ranks page 1 (brand-ish) — hub is a stub, see 1.4 |

### 1.2 Query clusters (the actual demand)

| Cluster | Queries (28d) | Imp. | Pos | Signal |
|---------|---------------|------|-----|--------|
| **Apéro belge** | `apero belge` (16), `apéritif belge` (7), `aperitif belge` | ~25 | **9.1 / 15.6** | Winning again. Pos 9 with 0 clicks on the no-accent variant = snippet/CTR gap |
| **Apéro marocain** | `apéro marocain`, `apéritifs marocains`, … | ~8 | 17–36 | Third place, stable |
| **Apéro portugais** | `apéro portugais`, `amuse bouche portugais`, … | ~8 | 15–46 | Portugal article has NO listicle competitor cluster in FR — opportunistic |
| **Moules quantities** | `combien de moules par personne` ×11 variants | ~17 | 61–79 | Pure PAA/FAQ demand pointed at the wrong page depth |
| **Conservation** | `méthodes de conservation des aliments` | 1 (click) | 99 | Page has the demand (95 imp) but ranks too deep |
| Brand/nav | `/`, `/a-propos`, `/blog`, `/techniques-culinaires` | ~22 | 2.5–5.2 | Healthy, not a traffic lever |

**Cluster insight:** demand concentrates on the **Belgique / Nord cluster** (fricadelles, moules, crevettes grises, gaufres, carbonade…) and the **apéro par pays** series — exactly the proven May–June assets. The 12 Italian pasta recipes and most Asian recipes show **zero impressions**: no demand reaches them (Marmiton owns those SERPs). Content effort should follow the demand, per [priorities-and-silos](../priorities-and-silos.md).

---

## 2. Content tuning targets (GSC × CMS cross-check)

Live content pulled from the prod CMS MCP on 2026-10-06. The recurring defect: **articles have no SEO rows** (`seo: null`, `excerpt: null`) — Google auto-generates snippets for the site's only proven click-earners.

### 2.1 P0 — Belgian apéro listicle (article #16) — *tune, don't rewrite*

- Ranks pos **9–10** on `apero belge` / `apéritif belge` (25+ impressions) with **no meta description** (Google-composed snippet) and an awkward title: *"10 Délicieuses Recettes de plat Apéritif belge pour l'Été"* ("Recettes de plat Apéritif" is not how anyone searches).
- **Action:** add SEO description (~150 chars, exact query `apéritif belge` + `apero belge` variants); retitle to front-load the query, e.g. *« Apéritif belge : 10 recettes de plats apéritifs pour l'été »*; H1 aligned; `ItemList` schema for the 10 items. Expected: pos 9 → top 5, CTR 4.6% → 8%+ on ~30 imp/mo.
- Same treatment for the whole series: **marocain (#8)**, **portuguais (#34, has meta — verify)**, **espagnol (#1)**, **italien (#7)**, **sud-africain (#4)**, **français (#6)**.

### 2.2 P0 — Africa-Nord desserts (article #9) — *meta only*

- 3 clicks / 114 imp / pos 30.5 and **no meta description**. The Aug audit's striking-distance action (`dessert afrique du nord`, pos 11.4) is still not done. Add description + keyword-aligned H2 per dessert + FAQ.

### 2.3 P1 — Moules marinières (recipe #24) — *content + schema*

- 61 impressions at pos 70.8 **plus** the `combien de moules par personne` cluster (~15 impressions, pos 61–79, 11 query variants). The answer exists in the data (2 kg for 4 → 500 g/person) but isn't **content**.
- **Action:** intro extension + FAQ block ("Combien de moules par personne ? 500 g en plat, 350 g en entrée…", "Quel vin blanc ?", "Comment savoir si elles sont cuites ?"), per-person quantities section, `FAQPage` schema. Target: the quantities cluster alone is a top-10 opportunity (low competition PAA-style queries).
- Live Recipe schema is flagged by GSC for **all recipes**: `author` invalid type (string, must be `Person`/`Organization`), missing `recipeCuisine`, missing `calories`, missing `aggregateRating`, nested items missing `url`/`name`/`image`. **One template fix in `apps/web` (SchemaOrgRecipe output) benefits all 54 recipes** — recommended before any content push.

### 2.4 P1 — Conservation des aliments (page #15) — *restructure*

- 95 impressions at pos 89.5 with 1 click (`méthodes de conservation des aliments`). Content is 8,966 chars but only 4 H2s, no FAQ, and SEO keywords are junk (`"conservation, sucre, seul, saumure"` — "seul" is a typo).
- **Action:** restructure around methods (frigo / congélation / conserve / saumure / séchage) with one H2 each + FAQ; fix keywords; align title toward *« méthodes de conservation des aliments »*. Internal-link from techniques hub + recipes (fish, herbs).

### 2.5 P1 — Recettes du monde hub (page #1) — *stub → real hub*

- Ranks pos 7.4 but content is a **1,964-char stub** with a null meta description and keywords `"recettes du monde, mondes"`. This is the Phase-3 centerpiece ([priorities](../priorities-and-silos.md)).
- **Action:** turn it into the taxonomy landing page: countries (Belgique, Maroc, Afrique du Nord, Portugal, Italie, Asie…) → linked listicles + country recipes, intro targeting `recettes du monde`. Every apéro listicle links up to it (they're its spokes).

### 2.6 P2 — Fricadelles (#27), Crevettes grises (#28), Gaufres (#26) — *cluster play*

- 47 + 25 + 16 impressions at pos 55–77. Same treatment as moules: enrich intro (history/Nord anchor), FAQ, internal links from the Belgian apéro listicle (which already has the authority) — the listicle should link down to these 3 recipes explicitly.

### 2.7 P2 — Guide friture maison (page #10) — *watch*

- pos 10 with 1 impression. No action needed yet beyond internal links from fricadelles/beignets/calamars recipes; re-check after the next crawl cycle.

---

## 3. Technical notes

- **Recipe schema warnings** (GSC rich-results): author type, `recipeCuisine`, `calories`, `aggregateRating`, nested `url`/`name`. Template-level fix in `apps/web`; track in Linear `jdc`.
- **Sitemap:** 113 URLs submitted (17 pages / 41 blog / 55 recipes), no errors. CMS currently holds 54 recipes + 43 articles + 20 pages published — blog sitemap (41) lags the 43 live articles: re-check the blog sitemap source after the next deploy.
- **Crawl cadence:** after each content refresh above, request recrawl (Indexing API) and add internal links from already-crawled pages.
- **Bing:** sitemaps OK; Bing API query endpoints error from the MCP (auth scope) — not blocking.

---

## 4. Priority order (next 30 days)

1. **Recipe schema template fix** (`apps/web`) — author/Person, `recipeCuisine`, `nutrition.calories`, `servings` — one fix, 54 pages.
2. **Meta pass on the 7 apéro-country articles + africa-nord desserts** — title + description aligned to the winning queries (CMS MCP, no code).
3. **Moules marinières** FAQ + quantities section (+ `FAQPage`).
4. **Recettes du monde hub** v1 (real landing page, meta, country sections, links from all listicles).
5. **Conservation des aliments** restructure + keyword fix.
6. Internal links: belgian listicle → fricadelles / crevettes / gaufres / moules.

Success check (early Nov): `apero belge` pos ≤5 with CTR >5%, moules cluster impressions converting to clicks, recipes cluster pos <40, recettes-du-monde impressions >20/mo.
