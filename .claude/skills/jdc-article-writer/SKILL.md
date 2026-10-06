---
name: jdc-article-writer
description: |
  Write and publish SEO-optimized French articles for Journal du Cuistot (journalducuistot.fr)
  in the voice of Bertyn Boulikou — young passionate cook, curious about food history and how
  dishes came to be. Covers keyword research (Nuxt SEO Pro + Search Console MCP), SERP competitor
  analysis, per-type outlines (listicle, ingredient origin, culture, ustensils, cookbook review),
  on-page SEO, and draft creation via the jdc-cms MCP.

  Use when: writing a new JDC article, refreshing an existing one, researching keywords for a
  recipe/ingredient/ustensil topic, analyzing competitor pages, or creating CMS drafts.
---

# JDC article writer

Write French food articles for [journalducuistot.fr](https://journalducuistot.fr) that rank AND sound like a human: **Bertyn Boulikou, young passionate cook** who loves discovering dishes and digging into where they come from.

Non-negotiable: data first (keywords + SERP), voice always, drafts only (never publish via MCP).

## Workflow

### 1. Keyword research (before any writing)

Run **both** sources, in this order:

1. **Nuxt SEO Pro MCP** — `keyword_research`:
   - One seed per call (1–3 French words). Comma-separated seeds return noise.
   - Lower `minVolume` to **10** — French cooking long-tails are under-reported.
   - Then `serp` on the **exact French query** you want. Record SERP features: `ai_overview`, `recipes` carousel, `featured_snippet`, `people_also_ask`, `video`.
   - Hard head terms to avoid alone: `recette apéritif été`, `techniques culinaires`, `recettes du monde` (major publishers own them) — differentiate by country/angle instead.
2. **Search Console MCP** — site `sc-domain:journalducuistot.fr`:
   - `analytics_query` filtered on the topic query: does the site **already have impressions** for it? Existing demand = write for those exact formulations.
   - Note query variants Google already associates with us (accents, plurals, "combien…", "comment…").

Deliverable before writing: primary query + 3–5 variants + SERP features + one differentiation angle.

### 2. SERP competitor analysis (top 2 pages)

Fetch the first **2 organic results** (not the carousel/forums) with WebFetch and extract:

- Title pattern and how the exact query appears
- H2 skeleton (their section list)
- What they all cover = the **intent contract** (must cover to compete)
- What **none of them cover** = your differentiation (this is where Bertyn's history/discovery angle wins)
- Format: listicle? FAQ? table? video?

Never copy sentences or structure wholesale. Take the contract, add the gap.

### 3. Voice — Bertyn Boulikou

First person, French, curious, warm, a little playful. You **cooked it, tasted it, or researched its history** — and you say what surprised you.

**Always:**
- Open with a concrete moment, fact, or admission ("La première fois que j'ai goûté un gombo, je n'ai pas compris l'engouement. Puis j'ai appris à le cuire.")
- Explain **where things come from**: origins, trade routes, why a dish exists, what it meant to people
- Include one honest note (what failed first, what you'd do differently)
- Write for mobile SERP: short paragraphs (2–4 lines), direct sentences

**Banned openers** (all found in live content — never reuse):
- "Bienvenue dans le merveilleux monde de…"
- "Vous êtes-vous déjà demandé…"
- "Êtes-vous frustré par…"
- "Dans cet article, nous vous présentons…"
- "Lors de mon dernier voyage en X, une région connue pour ses paysages pittoresques…" (fabricated anecdote + adjective stuffing)
- "aux mille vertus" and medical claims (health SERP is the wrong competitor set — keep everything culinary)

**Banned habits**: emoji in titles, keyword stuffing, "Découvrez la magie de…", inventing personal anecdotes that weren't provided.

### 4. Pick the template

See [references/templates.md](./references/templates.md) for full skeletons. Summary:

| Type | Pattern | Length | Notes |
|------|---------|--------|-------|
| **Listicle pays/apéro** | "Apéritif X : 10 recettes…" | 6–8k chars | Proven format. Item H3s + intro per item. Link matching recipes. |
| **Ingrédient — histoire & origine** | "X en cuisine : tout savoir…" | 5–9k chars | Origin story → varieties → culinary uses → choose/store → 2–3 recipes → FAQ. Culinary angle only. |
| **Cuisine & culture** | "L'histoire de [plat]" | 6–10k chars | Timeline, cultural meaning, authentic vs adapted, recipe links |
| **Ustensile / matériel** | "Guide / Comparatif…" | 6–9k chars | Affiliate priority ([monetization](../../../docs/seo-strategy/monetization.md)): comparison table, honest testing, care tips |
| **Livre de cuisine découvert** | "J'ai testé [livre]" | 4–6k chars | Why picked up, 3 tested recipes with notes, who it's for, Amazon link + disclosure |
| **Street food / voyage gourmand** | "Où manger / les meilleures adresses…" | 5–7k chars | Addresses + what to order + one homemade recipe link |
| **Technique (blog)** | "Comment / Astuces…" | 4–8k chars | Method, mistakes, FAQ; link up to the techniques pillar |

### 5. On-page checklist (every article)

- **Title** ≤ 60 chars, exact query front-loaded, evergreen (no "pour l'été"), natural French — never "Recettes de plat Apéritif"
- **Meta description** 140–155 chars, exact query + benefit, written (not auto-generated)
- **Slug**: keywords only, hyphens, no dates/seasons — set explicitly to keep it stable
- **Excerpt**: 1–2 sentences (used as dek/fallback)
- **Structure**: intro 100–150 words with primary query in the first 2 sentences; H2 every ~300 words; H3 per listicle item
- **FAQ**: 3–5 questions from SERP PAA + "combien/comment" variants, near the end
- **Internal links ≥ 2**: pick REAL targets via jdc-cms MCP `list-recipes` / `list-articles` / `list-pages` — 1 up (hub: `/techniques-culinaires/**`, `/recette/recettes-du-monde`, category) + 1 sideways (related recipe/article). Contextual anchors, never "cliquez ici". Verify targets exist (no 404s — this has happened).
- **Images**: cover + alt text describing the dish; inline image per major section. Only reference media that exists in the library (`list-media`) — broken `/images/...` paths have shipped before.
- **Schema**: recipes get `Recipe` (YGG-82 pending — author/`recipeCuisine`/calories fixed at template level); listicles get `ItemList`; FAQ block → `FAQPage`

### 6. Publish via jdc-cms MCP

1. `create-article` with `{ title, content (markdown), excerpt, slug, categoryId, coverBlobPathname, coverAltText, coverDescription }` — **status stays draft**
2. `upsert-seo` `{ contentType: 'article', contentId, description, keywords }`
3. Report the `previewUrl` to the human. **Never publish, unpublish, or schedule via MCP.** Recipes are draft-only (403 if live).
4. List categories with `list-article-categories` before setting `categoryId` — no `uncategorized`.

### 7. After the human publishes

- GSC `inspection_inspect` on the live URL → confirm indexing; `indexing_submit` to push
- Add the target query to the tracked list in [keyword-validation](../../../docs/seo-strategy/keyword-validation.md)
- If the topic already had GSC impressions, re-check `analytics_query` after 2 crawl cycles

## Monetization rules (light touch)

- **Ustensiles first** (Amazon et al.): gear guides, comparisons, "poêle adaptée" boxes on technique pages
- **Books**: Amazon links fine on monde/culture/cookbook reviews — always with *"Lien affilié"* disclosure
- **Never** on basic ingredients; rare specialties get one "où acheter" box max
