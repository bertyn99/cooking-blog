# Priorities & content silos

**Horizon:** Post–Strapi import → first 6 months on `apps/web` + `apps/cms`  
**Goal:** Qualified organic traffic (FR), not generic listicle churn.

## Strategic silos

```text
                    ┌─────────────────────┐
                    │  /recette (recipes) │
                    └──────────┬──────────┘
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   techniques culinaires   ingrédients / glossaire   monde & apéro
   (CMS pages)            (blog → glossary)        (hubs + listicles)
           │                   │                   │
           └───────────────────┴───────────────────┘
                         internal links
```

| Silo | Primary intent | Main URL pattern | Win condition |
|------|----------------|------------------|---------------|
| **Techniques** | Learn a method | `/techniques-culinaires/**` | Rank long-tail “comment…”; support recipe engagement |
| **Ingrédients** | Understand + cook | `/blog/cuisine-sante/**` → future `/glossaire/**` | Culinary angle; link to recipes by ingredient |
| **Monde & apéro** | Discover + cook | `/recette/recettes-du-monde`, `/blog/inspiration-culinaire/**` | Country/season hubs, fewer stronger URLs |
| **Matériel** | Buy / use gear | `/blog/materiels-ustensils/**` | Comparisons + link to techniques; **primary affiliate** ([monetization](./monetization.md)) |
| **Voyage gourmand** | Local discovery | `/blog/guides-gourmands/**` | Unique “adresses + recettes maison” |

---

## Execution phases

### Phase 1 — Foundation (weeks 1–4 after import)

| Task | Owner | SEO impact |
|------|--------|------------|
| Cut web to CMS API; sitemaps from new source | Eng | Indexation |
| Fix article → `category_articles` FK | Eng | Correct `/blog/:category/:slug` |
| Canonicalize duplicate épices page | Eng + editorial | Consolidate signals |
| GSC + sitemap submit | SEO | Measurement |
| Strengthen `/a-propos` (author, methodology) | Editorial | E-E-A-T |

### Phase 2 — Techniques cluster (weeks 4–12)

| Task | SEO impact |
|------|------------|
| Align titles with SERP queries (e.g. “Comment saisir la viande”) | CTR + relevance |
| FAQ block + `FAQPage` schema on each method page | PAA / snippets |
| Short video on high-value pages (saisir, grillade) | Video SERP |
| Each technique → 3–5 recipe links; recipes → technique in intro | PageRank flow |
| Parent hub `/techniques-culinaires` lists all children with descriptions | Crawl depth |

### Phase 3 — Ingrédients & hubs (months 2–4)

| Task | SEO impact |
|------|------------|
| Launch glossary MVP or formalize “tout savoir” as template | Long-tail ingredients |
| Reframe health-adjacent copy to **cuisine** (see [keyword validation](./keyword-validation.md)) | Avoid wrong SERP (supplements) |
| Build `/recette/recettes-du-monde` with countries + filters | Head term + internal structure |
| Consolidate apéro listicles → **one hub per country** (update yearly) | Fewer cannibalizing URLs |

### Phase 4 — Scale (months 4–6)

| Task | SEO impact |
|------|------------|
| Ingredient hub pages `/recette/ingredient/[slug]` (programmatic, quality gates) | Long-tail recipe discovery |
| Allergen flags + `/recette/sans-[allergène]` hubs (when data exists) | Trust + niche queries |
| Seasonal pushes (marinades, grillades — May–Aug) | Freshness |

---

## On-page & technical checklist (per template)

### Technique page

- [ ] H1 matches primary query (French)
- [ ] Steps clear (HowTo or structured sections)
- [ ] FAQ (3–5 questions from PAA research)
- [ ] 3+ internal links to recipes
- [ ] 1+ link up to pillar + sideways to related methods
- [ ] `BreadcrumbList` (existing pattern on web)

### Article (listicle / guide)

- [ ] Unique intro (not only numbered list)
- [ ] `ItemList` or clear recipe cards with links
- [ ] Category correct (no `uncategorized`)
- [ ] Canonical if near-duplicate seasonal posts

### Recipe

- [ ] `Recipe` schema (ingredients, time, image)
- [ ] Link to technique + ingredient/glossary when relevant
- [ ] OG image (Cooking template)

### Site-wide

- [ ] `sitemap.xml` (pages, blog, recipes) — already split in web
- [ ] `hreflang` if multi-locale later (`locale` in CMS ready)
- [ ] Core Web Vitals on recipe listing (images via sharp pipeline)

---

## What we deprioritize (for now)

| Tactic | Reason |
|--------|--------|
| Head term `recette apéritif été` as sole strategy | SERP dominated by major publishers + recipe carousel |
| Head term `techniques culinaires` only | Wikipedia / education sites own the term |
| Thin programmatic thousands of URLs | Quality risk; start with ingredient hubs + rules |
| Medical “bienfaits” positioning | Wrong competitor set in SERP |

---

## Success metrics

| Metric | Source | Target (indicative) |
|--------|--------|---------------------|
| Indexed URLs (recipes + key pillars) | GSC | 100% of published |
| Impressions on technique long-tails | GSC | Upward trend M2–M6 |
| Average position on tracked list | SEO Pro `rankings` | Document baseline at launch |
| CTR on recipe rich results | GSC | Monitor after schema stable |
| Internal links per recipe | Crawl / audit | ≥ 2 editorial (technique or ingredient) |

Update this doc when phases complete or when GSC shows a new winning query cluster.
