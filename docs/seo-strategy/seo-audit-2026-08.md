# SEO audit — Journal du Cuistot

**Date:** 2026-08-12  
**Site:** [journalducuistot.fr](https://journalducuistot.fr)  
**Period (primary):** last 28 days (≈ 2026-07-13 → 2026-08-09)  
**Sources:** Google Search Console (Nuxt SEO Pro sync, complete through 2026-08-11), SEO Pro sprint / crawl tickets, DataForSEO domain + competitor snapshots  
**Assessment verdict (SEO Pro):** reach = *growing*, health = *healthy* — but GSC shows a sharp **click and ranking collapse** in the last 28 days; treat “healthy” as crawl/infra relative to peers, not as organic performance.

---

## Executive summary

Organic search is **almost flatlined on clicks** while **impressions rose**. Average position worsened from ~23 → ~63 in one month. Only **~20% of tracked URLs are indexed** (23/113). A handful of summer apéro / Afrique-du-Nord listicles still carry almost all demand; competitive recipe URLs (especially `/recette/moules-marinieres`) get impressions deep on page 8–9 with **zero CTR**.

### Critical production defect (found during fix pass)

Live HTML (2026-08-12) served:

- `canonical` / `og:url` → `http://localhost:3000/...`
- `x-robots-tag: noindex, nofollow` on content pages
- `robots.txt` → `Disallow: /` (nuxt-robots “indexing disabled”)
- Sitemap locs → `http://localhost:3000/...`

**Root cause:** prod deploy without a working `PROD_WEB_HOST` / `NUXT_PUBLIC_SITE_URL`, so Nuxt Site Config treated the site as non-indexable localhost. This alone explains the indexation collapse and “sitemap URLs are noindex” tickets. Code hardening + redeploy with `PROD_WEB_HOST=journalducuistot.fr` is required before content SEO work can compound.

| Signal (28d) | Current | Prior 28d | Δ |
|--------------|---------|-----------|---|
| Clicks | **1** | 8 | **−87.5%** |
| Impressions | **346** | 276 | **+25%** |
| CTR | **0.29%** | 2.90% | collapse |
| Avg. position | **63.1** | 23.0 | much worse |

**3-month context:** 22 clicks / 992 impressions / CTR 2.2% / pos 34 — slightly better clicks than the prior 3m (18), but almost all of that came **before mid-June**. Since ~2026-06-22 the site has been effectively click-dead aside from one click on 2026-08-02.

**Bottom line:** Fix indexation + broken internal URLs first, then reclaim the 3–4 pages that already proved they can earn clicks, then compete on African/Francophone niches (not Marmiton head terms).

---

## 1. Performance summary

### 1.1 Trend

- **Impressions rising, rankings falling:** Google still shows the site, but mostly far below the fold (desktop avg pos ~73).
- **Spike without conversion:** 2026-08-06 had **72 impressions** and **0 clicks** (avg pos ~69) — classic “visible but not chosen” pattern.
- **Seasonal cliff:** Apéro listicles that worked in May–June (Belgian, Moroccan, North-African desserts) lost position and CTR into July–August.

### 1.2 Totals & geography (28d)

| Dimension | Detail |
|-----------|--------|
| Totals | 1 click · 346 impressions · CTR 0.29% · pos 63.1 |
| **France** | 1 click · 191 impressions · pos 66.5 (prev clicks: 4) |
| **Belgium** | 0 clicks · 29 impressions · pos 70.5 (prev clicks: 2) |
| UK | 0 · 15 · pos 81.8 |
| Other | Long tail of tiny impression countries (no clicks) |

Primary audience remains **FR + BE**. Belgian demand for apéro content is real and recently lost — defend it.

### 1.3 Devices (28d)

| Device | Clicks | Impressions | CTR | Position |
|--------|--------|-------------|-----|----------|
| **Mobile** | 1 | 46 | 2.2% | **34.8** |
| Desktop | 0 | 272 | 0% | **73.4** |
| Tablet | 0 | 4 | 0% | 35 |

Desktop dominates impressions but ranks much worse. Optimize titles/snippets for **mobile SERP** first (where the only click came from), then diagnose why desktop positions are so deep (likely different query mix + competition).

### 1.4 Top pages (28d)

| Page | Clicks | Imp. | CTR | Pos | vs prior |
|------|--------|------|-----|-----|----------|
| `/blog/inspiration-culinaire/10-desserts-delicieux-de-la-cuisine-d-afrique-du-nord` | **1** | 84 | 1.2% | 33.6 | clicks −1; was pos ~19 |
| `/recette/moules-marinieres` | 0 | **167** | 0% | **85.6** | still buried |
| `/blog/.../10-delicieuses-recettes-de-plat-aperitif-marocain...` | 0 | 15 | 0% | 32.3 | was ~13.8 |
| `/recette/crevettes-grises-a-la-biere` | 0 | 20 | 0% | 77.9 | — |
| `/blog/.../10-delicieuses-recettes-de-plat-aperitif-belge...` | 0 | 5 | 0% | 31.2 | **was 6 clicks**, pos ~12 |
| `/recette/gaufres-salees-fromage-legumes` | 0 | 11 | 0% | 89.2 | — |
| `/` | 0 | 4 | 0% | 3.3 | brand/nav |
| `/recette/croquettes-de-fromage` | 0 | 4 | 0% | **4.8** | near page 1, no CTR |

### 1.5 Top pages (3m) — what still works when averaged

| Page | Clicks | Imp. | CTR | Pos |
|------|--------|------|-----|-----|
| Belgian apéro listicle | **10** | 152 | 6.6% | 13.2 |
| North-Africa desserts | **9** | 294 | 3.1% | 21.9 |
| Moroccan apéro listicle | **3** | 211 | 1.4% | 14.3 |
| Moules marinières | 0 | 196 | 0% | 85.3 |

These three inspiration articles are the **only proven organic assets**. Everything else is speculative or discovery-stage.

### 1.6 CrUX / Lighthouse

- **CrUX:** no origin data (insufficient real-user traffic).
- **Lighthouse monitoring:** no pages configured in SEO Pro dashboard — add `/`, a top article, and a recipe template when CWV work starts.

---

## 2. Quick wins (striking distance & reclaim)

### 2.1 Official striking-distance preset (pos 4–20)

| Keyword | Page | Pos | Imp. | CTR | Action |
|---------|------|-----|------|-----|--------|
| **dessert afrique du nord** | `/blog/inspiration-culinaire/10-desserts-delicieux-de-la-cuisine-d-afrique-du-nord` | **11.4** | 20 | 0% | Rewrite title/meta for exact query; add H2s per dessert + FAQ; internal links from techniques + recipes; aim top 5 → ~3 potential clicks/mo at current volume |

### 2.2 Near-page-1 pages with impressions but no clicks

| Page / query cluster | Pos | Imp. | Action |
|----------------------|-----|------|--------|
| `/recette/croquettes-de-fromage` | **4.8** | 4 | Improve title + recipe schema completeness; expand intro with primary keyword variants |
| `apéro marocain` / `apéritifs marocains` / `apéritif marocain` | ~20–22 | 2–4 each | Refresh Moroccan apéro article title/description; consolidate variants into one clear H1 |
| `apéritif belge` | 28.5 | 2 | Reclaim — this cluster produced **most 3m clicks**; was previously as strong as pos ~3 on related queries |
| Brand/nav: `/`, `/a-propos`, `/blog`, `/techniques-culinaires` | 2–4 | low | Ensure unique value props; not a traffic lever yet |

### 2.3 Highest-volume zero-CTR recipe (authority play)

| Keyword cluster | Imp. (28d) | Pos | Page |
|-----------------|------------|-----|------|
| moules marinières (+ variants) | **~80+** combined | **84–91** | `/recette/moules-marinieres` |

Not striking distance today, but it is the **#1 impression magnet** after the dessert article. Needs a full content + E-E-A-T upgrade (photos, tips, schema, comparisons) before it can climb — treat as a Phase-2 content project, not a meta tweak.

---

## 3. Growth opportunities

### 3.1 High-impression / low-CTR (manual, from GSC rows)

Preset `opportunity` returned empty (volume too low for thresholds). Manual read of the same rows:

| Keyword | Imp. | Pos | CTR | Opportunity |
|---------|------|-----|-----|-------------|
| dessert afrique du nord | 20 | 11.4 | 0% | Snippet + content depth |
| moules marinières | 18 | 84.9 | 0% | Long-term recipe competitiveness |
| dessert africain | 15 | 61.2 | 0% | Same article as North Africa desserts — expand scope or create sibling hub |
| moule mariniere | 15 | 90.9 | 0% | Same recipe URL |
| recette moules marinières | 13 | 86.1 | 0% | Same |
| apéro marocain (+ family) | ~10 | 20–32 | 0% | Title/CTR + refresh |
| recette crevettes grises | 5 | 87 | 0% | `/recette/crevettes-grises-a-la-biere` |

### 3.2 Non-brand demand (brand terms filtered)

All measured traffic is non-brand. Top non-brand impressions (28d): dessert afrique du nord, moules marinières, dessert africain, moule mariniere, recette moules marinières. Brand share ≈ 0%.

### 3.3 Competitor gaps (content expansion)

Closest **niche** competitor: **aistoucuisine.com** (~575 organic visits, 228 keywords). High-volume gaps aligned with Journal du Cuistot’s Afrique / diaspora positioning:

| Gap keyword | Comp. pos | Volume | Why it fits |
|-------------|-----------|--------|-------------|
| poulet dg | 18 | 720 | Cameroonian classic |
| poulet mayo | 6 | 480 | High intent recipe |
| thiebou guinar / thieb | 6–10 | 210–260 | Senegalese staples |
| jus de bissap | **2** | 170 | We already have `/recette/jus-de-bissap` (pos ~6.5, 2 imp) — **reinforce & interlink** |
| thiéré sénégal | 2 | 140 | Couscous mil niche |
| fataya sénégal | 7 | 170 | Street-food / apéro adjacent |
| pâte d'arachide | 10 | 210 | Ingredient / technique bridge |

Do **not** chase Marmiton head terms (crêpes, blanquette, etc.) — wrong competitive set.

### 3.4 Authority / links

| Metric | Value |
|--------|-------|
| Referring domains | **10** |
| Backlinks | **12** |
| Nofollow share | high (9/12 pages nofollow) |
| Broken backlinks | 2 |
| Domain rank (DFS) | 10 |
| Estimated organic traffic (DFS) | **~0** |

Link building is almost nonexistent. Priority after technical fixes: digital PR / cuisine blogs / local FR food media; reclaim any lost referring pages.

---

## 4. Defense priorities (decay & regressions)

Official `decay` / `movers-declining` presets returned empty (absolute volumes below detectors). Evidence from page/keyword comparisons is clear:

### 4.1 Pages losing rank & clicks

| Page | Evidence | Defense action |
|------|----------|----------------|
| Belgian apéro listicle | 3m: **10 clicks**; 28d: **0 clicks**, pos 12→31 | Refresh for evergreen (remove “pour l’été” seasonality trap or update for current season); strengthen internal links; improve CTR |
| North-Africa desserts | Still only click source; pos 19→34; CTR weak | Striking-distance upgrade (section 2) |
| Moroccan apéro | 3m: 3 clicks; pos ~14→32 | Same refresh pattern as Belgian |
| Portuguese apéro | Imp. still present; pos 21→55 | Update or merge into country hub |

### 4.2 Keywords that vanished (prev period had rank, now 0 impressions)

Examples with previous positions: `apéro belge recette` (**pos 3**), `tapas marocain` (12), `aperitif portugais` (14), `apéritifs marocains` family, `amuse bouche marocain` (18). These are **defense + reclaim** targets tied to the same three articles.

### 4.3 Indexation decay (critical)

| Issue | Count / change |
|-------|----------------|
| Indexed coverage | **23/113 (20.4%)** |
| Not indexed | **90** |
| Discovered, not indexed | **56** |
| Crawled, not indexed | **14** |
| Unknown to Google | **20** |
| Stale crawl (30+ / 60+ days) | 29 / 21 |
| Indexed % trend | **37% → 24%** (−13 pts / ~6 weeks) |
| Sitemap size | **−26 URLs** (now ~83) |
| `sitemap-pages.xml` | **1 error**, pending in GSC |

Without fixing coverage, content work will not compound.

### 4.4 Technical / crawl tickets (open, ranked)

| Priority | Finding | Scale | Effort |
|----------|---------|-------|--------|
| P0 | Broken pages → `/blog/undefined` (and related non-200) | **67 pages** | S |
| P0 | Sitemap lists **noindex** URLs | **19 URLs** | S |
| P0 | Sitemap URLs that **redirect** | 4+ | S |
| P1 | `multiple-h1` systemic (100% of `/techniques-culinaires`, 114 pages sitewide census) | 13–114 | M |
| P1 | `open-graph-invalid-date-format` (72% of `/recette`, 100% of techniques) | 52+13 | M |
| P1 | Under-linked / orphan-ish pages (e.g. ustensiles débutants article) | 42 links census | M |
| P2 | Broken external (`bit.ly/J_Umma`) | 2 pages | M |
| P2 | Homepage a11y: link-name, color-contrast; deprecations | 1 page | S |
| P2 | Soft 404: `/recette/les-ustensiles-de-cuisine-indispensables-pour-les-cuisiniers-debutants` | 1 | S |

Also noted: new backlink from **correze-co.fr** (positive).

---

## 5. Prioritized action plan

Ordered by likely impact given current evidence. Every item cites a metric or ticket.

### P0 — Unblock Google (this week)

0. **Redeploy with correct public site URL** (blocks everything else). Live site currently bakes `http://localhost:3000` → site-wide `noindex` + bad canonicals/sitemaps. Ensure `PROD_WEB_HOST=journalducuistot.fr` and ship the deploy workflow fix that exports `NUXT_PUBLIC_SITE_URL` at build time. Verify after deploy: canonical `https://journalducuistot.fr/...`, robots allow indexing, sitemap locs use the public host.
1. **Kill `/blog/undefined` link generation** (ticket `1ac38ce4-…`, 67 non-200). Sanitize markdown + category fallbacks; verify with `curl -sI`. Crawl budget is being burned on 404s.
2. **Fix sitemap hygiene:** remove noindex URLs (ticket `7635ba36-…`, 19 URLs — mostly site-wide noindex from (0)); replace redirecting sitemap entries with final URLs (ticket `99f39bd9-…`); drop broken `sitemap-pages.xml` from GSC (done 2026-08-12) and keep `__sitemap__/pages|blog|recipes.xml`.
3. **Request indexing** (after fixes) for the three proven URLs: Belgian apéro, North-Africa desserts, Moroccan apéro — plus `/recette/moules-marinieres` and `/recette/jus-de-bissap`.

### P1 — Reclaim proven traffic (1–2 weeks)

4. **Upgrade North-Africa desserts page** for `dessert afrique du nord` (pos 11.4, 20 imp, 0 CTR; only striking-distance hit). Title, meta, H2 structure, FAQ, internal links.
5. **Refresh Belgian + Moroccan apéro articles** (combined **13 of 22** clicks in 3m; both lost position in 28d). Remove stale seasonal framing or update in place; tighten titles toward `apéritif belge` / `apéro marocain`.
6. **Fix template regressions:** single H1 per page; valid OG `article:published_time` / date formats on `/recette` and `/techniques-culinaires` (tickets `73c43af9-…`, `17c50091-…`, `dc9a002c-…`).

### P2 — Convert impression sinks (2–4 weeks)

7. **Rewrite `/recette/moules-marinieres`** (167–196 impressions, pos ~85, 0 clicks). Compete on completeness, photos, tips, schema — not on thin uniqueness.
8. **Push `/recette/jus-de-bissap`** (already pos ~6.5 with tiny impressions; competitor ranks #2 for `jus de bissap` at vol. 170). Interlink from African drinks article + techniques.
9. **Internal linking pass** for under-linked matériel / recipe pages (ticket `52b15169-…`); add body links from hubs, not footer-only.

### P3 — Expand niche (months 1–3)

10. Publish or deepen recipes in the **aistoucuisine gap set** (poulet dg, yassa/mayo, thiéb, thiéré, fataya, nokoss) — see [priorities-and-silos](./priorities-and-silos.md) Monde & apéro silo.
11. Build **one country hub** (e.g. cuisine sénégalaise / africaine) that absorbs listicle equity instead of spawning more competing “10 recettes…” URLs.
12. Light **link outreach** (10 referring domains is insufficient for recipe SERPs).

### P4 — Measurement hygiene

13. Add Lighthouse-monitored URLs in SEO Pro (`/`, top article, recipe template).
14. Re-run this audit monthly via GSC `28d` + `next_actions`; update this file or add `seo-audit-YYYY-MM.md`.
15. Track brand vs non-brand once branded queries appear (currently ~0 brand impressions).

---

## 6. Evidence appendix

### 6.1 GSC connection

- Property: `https://journalducuistot.fr`
- Sync: complete (162/162 days), range **2025-02-08 → 2026-08-11**
- Sitemaps seen by GSC: index + `sitemap-pages.xml` (error) + `__sitemap__/pages|blog|recipes.xml`

### 6.2 SEO Pro sprint snapshot (2026-08-12)

- Open tickets: **11** · Shipped historically: **12** · In progress: **0**
- Phase: “Getting set up” (week 9) · Goal: grow-traffic
- Next action: broken page `/blog/undefined`

### 6.3 What was *not* available

- CrUX CWV (no traffic)
- Lighthouse medians (no monitored pages)
- Automated opportunity / decay / zero-click presets (volume below thresholds — manual rows used instead)
- Keyword research volumes for our own GSC queries (not run in this pass; competitor volumes from tracked competitors only)

### 6.4 Related strategy docs

- [Content inventory](./content-inventory.md)
- [Keyword validation](./keyword-validation.md)
- [Priorities & silos](./priorities-and-silos.md)
- [Product ↔ SEO](./product-features-seo.md)
- [Monetization](./monetization.md)

---

*Audit authored from live Nuxt SEO Pro + GSC evidence on 2026-08-12. Do not treat competitor volumes as GSC facts for our property.*
