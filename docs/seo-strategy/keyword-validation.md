# Keyword validation (Nuxt SEO Pro)

**Tool:** Nuxt SEO Pro MCP (`keyword_research`, `domain_info`, `competitors`)  
**Last run:** 2026-07-21  
**Domain:** `journalducuistot.fr`

## Baseline metrics

| Check | Type | Result | Interpretation |
|-------|------|--------|----------------|
| Organic rankings | `rankings` | No data | Domain not in tool index yet — expected pre/post cutover |
| Traffic estimate | `traffic` | 0, no top pages | Same; use GSC after launch |
| Competitors | `discover` | Not run | Run after GSC + 4–8 weeks of impressions |

**Action:** Verify site in Google Search Console, link to SEO Pro, re-run `rankings` monthly.

---

## How to use SEO Pro in this project

### `keyword_research` — `research`

- Use **one seed** per call (1–3 French words). Comma-separated seeds returned unrelated suggestions in testing.
- Default filters (`minVolume: 100`, `maxDifficulty: 45`) often **exclude** valid French long tails; lower `minVolume` to `10` and read verbose output for listicle H2s.
- Cooking seeds frequently show **low reported volume** but strong **intent match** — pair with SERP analysis.

### `keyword_research` — `serp`

- Run on the **exact query** you want to rank for before writing or restructuring a hub.
- Note: `ai_overview`, `recipes` carousel, `featured_snippet`, `people_also_ask`, `video`.

### `keyword_research` — `rankings`

- Track progress after migration; compare URL groups (techniques vs blog vs recettes).

---

## SERP validation (2026-07-21)

Queries aligned with existing or planned content.

| Query | Competition snapshot | Recommendation |
|-------|----------------------|----------------|
| `techniques culinaires` | Wikipedia, culinary schools, YouTube, CAP PDFs | **Hub branding**, not primary volume target |
| `comment saisir une viande` | Cuisineaz, Ricardo, Traeger, YouTube, PAA | **Target** — existing page `saisir-viande-parfaitement`; add FAQ, video, recipe links |
| `épices indispensables cuisine` | Featured snippet, Quitoque, Cuisine Actuelle, spice retailers | **List + snippet** — merge duplicate épices URLs; link to recipes |
| `recette apéritif été` | Elle, Marie Claire, Ricardo, **recipe carousel** | **High difficulty** — differentiate by country, budget, dietary angle |
| `street food asiatique recette` | Niche blogs (e.g. le-panier-de-flo), AI overview | **Winnable** — strengthen existing article + recipe cluster |
| `recettes du monde` | Elle, Ricardo, Cuisineaz, thematic sites | **Hard head term** — invest in `/recette/recettes-du-monde` as real hub |
| `tout savoir sur le curcuma` | Health / supplement brands | Reframe food site copy: **`curcuma en cuisine`**, usage in recipes, not medical claims |

SERP tools returned **no results** for some long phrases (`nuoc mam cuisine`, `poêle fonte débutant`) — validate manually in Google FR when planning those URLs.

### `recette apéritif` — research sample (verbose, min volume 10)

Illustrative long tails (micro-volume in tool): `recette blinis apéritif`, `gâteau apéritif recette`. Useful for **internal anchors**, not main head terms.

---

## Tracked keyword list (starter)

Review quarterly; add winners from GSC “Queries”.

### Techniques (existing CMS pages)

```
comment saisir une viande
cuisson vapeur légumes
comment braiser viande
technique étouffée cuisine
conservation aliments cuisine
```

### Épices & ingrédients (blog + glossary future)

```
épices indispensables cuisine
curcuma en cuisine
nuoc mam recette
comment utiliser le curry
coriandre fraîche recette
```

### Monde & apéro (existing listicles)

```
street food asiatique recette
apéritif marocain facile
apéritif italien recette
recettes cuisine du monde facile
```

### Matériel (existing blog)

```
poêle fonte entretien
ustensiles cuisine débutant
types de poêles cuisine
```

### Hubs recettes

```
recettes du monde
```

---

## Workflow for a new page or hub

1. Pick URL from [content inventory](./content-inventory.md) or propose new hub.
2. SEO Pro **`serp`** on primary query (+ one variant).
3. If SERP is recipe carousel or national media only → choose **long-tail** or **country/constraint** angle.
4. Draft title/H1 to match query intent (how-to vs list vs guide).
5. Ship with internal links (3–5 recipes + parent pillar).
6. Add FAQ / HowTo / Recipe schema as appropriate ([priorities](./priorities-and-silos.md)).
7. After 28 days, check GSC + SEO Pro `rankings`.
