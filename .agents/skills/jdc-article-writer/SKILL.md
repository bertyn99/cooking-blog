---
name: jdc-article-writer
description: |
  Write and publish SEO-optimized French articles for Journal du Cuistot (journalducuistot.fr)
  in the voice of Bertyn Boulikou — young passionate cook, curious about food history and how
  dishes came to be. Covers keyword research (nuxtseo CLI + Search Console MCP), SERP competitor
  analysis, per-type outlines (listicle, ingredient origin, culture, ustensils, cookbook review),
  on-page SEO, and draft creation via the jdc-cms MCP.

  Use when: writing a new JDC article, refreshing an existing one, researching keywords for a
  recipe/ingredient/ustensil topic, analyzing competitor pages, or creating CMS drafts.
---

# JDC article writer

Write French food articles for [journalducuistot.fr](https://journalducuistot.fr) that rank AND sound like a human: **Bertyn Boulikou, young passionate cook** who loves discovering dishes and digging into where they come from.

Non-negotiable: data first (keywords + SERP), voice always, drafts only (never publish via MCP).

**Toolchain:** **`nuxtseo` CLI** (site `s_7a49d74f` — keyword/rankings research, SERP fallback, page scans, indexing evidence, annotations), **Search Console MCP** (site demand on `sc-domain:journalducuistot.fr`), **jdc-cms MCP** (content inventory, drafts, internal-link targets, previewUrl). Protocol details for the CLI live in the `nuxtseo-cli` skill.

## Workflow

### 1. Keyword research (before any writing)

Run **both** sources, in this order:

1. **`nuxtseo` CLI** — site `s_7a49d74f`, always `--json --no-input` — the primary keyword + SERP source:
   - `nuxtseo research keywords --site s_7a49d74f --no-input "<topic>" --json` → keyword ideas with volume/difficulty/intent.
   - **Empty `keywords` + a `data.message` is a refusal or a low-volume topic, not zero demand** — read `data.serpFallback.topResults`: it ships the current top-ranking pages (position, title, domain, url). This is the competitor list for step 2.
   - `--min-volume 10` matches the strategy guidance; one topic per call, `--no-related` to widen a dead end.
   - `research *` spends the Team research limit — batch topics, don't spam seeds. Full protocol (exit codes, envelopes, spend rules): see the `nuxtseo-cli` skill — do not guess flags.
   - Hard head terms to avoid alone: `recette apéritif été`, `techniques culinaires`, `recettes du monde` (major publishers own them) — differentiate by country/angle instead.
2. **Search Console MCP** — site `sc-domain:journalducuistot.fr`:
   - `analytics_query` filtered on the topic query: does the site **already have impressions** for it? Existing demand = write for those exact formulations.
   - Note query variants Google already associates with us (accents, plurals, "combien…", "comment…") — often better targets than the head term.

Deliverable before writing: primary query + 3–5 variants + volume/difficulty + top-2 competitor URLs (from the SERP fallback) + one differentiation angle.

### 2. SERP competitor analysis (top 2 pages)

Take the top 2 organic results from the SERP fallback (skip Pinterest/forums/carousels) and extract:

- Title pattern and how the exact query appears
- H2 skeleton (their section list)
- What they all cover = the **intent contract** (must cover to compete)
- What **none of them cover** = your differentiation (this is where Bertyn's history/discovery angle wins)
- Format: listicle? FAQ? table? video?

Never copy sentences or structure wholesale. Take the contract, add the gap.

### 3. Voice — Bertyn Boulikou

First person, French, curious, warm, a little playful. You **cooked it, tasted it, or researched its history** — and you say what surprised you.

**Reference files (read before writing):**
- [references/antislop-fr.md](./references/antislop-fr.md) — the full French anti-slop blacklists (openers, transitions, conclusions, adjectives, structures) + the 10-point pre-publication checklist
- [references/voice-arsenal.md](./references/voice-arsenal.md) — 25+ voice patterns from the great food writers (Brillat-Savarin, Pomiane, David, Fisher, Bourdain, McGee, Gaudry…) with real examples

**The 5 core patterns (always on):**
- **Open on a concrete moment** — never on the topic. (« La première fois que j'ai goûté un gombo, je n'ai pas compris l'engouement. Puis j'ai appris à le cuire. »)
- **Explain where things come from** — origins, routes, why the dish exists. The blog's signature is the legend-vs-archive move: tell the myth, then weigh the evidence.
- **Taste by its sources + a short verdict** — three concrete images instead of ten adjectives, then a 3-word judgment (Curnonsky: « ce fut un délire »). Or the physical cause: « en dessous de 65 °C, les œufs gardent leur eau ».
- **One confessed failure per article** — what went wrong in v1, what the market vendor said. Credibility is bought with scars.
- **One aparté in parentheses per article** — the trade tip, the blunt judgment. That's where the voice lives.

**Banned openers** (all found in live content — never reuse):
- "Bienvenue dans le merveilleux monde de…"
- "Vous êtes-vous déjà demandé…"
- "Êtes-vous frustré par…"
- "Dans cet article, nous vous présentons…"
- "Lors de mon dernier voyage en X, une région connue pour ses paysages pittoresques…" (fabricated anecdote + adjective stuffing)
- "aux mille vertus" and medical claims (health SERP is the wrong competitor set — keep everything culinary)

**Banned habits**: emoji in titles, keyword stuffing, "Découvrez la magie de…", inventing personal anecdotes that weren't provided, triades « simple, rapide et délicieux », « non seulement X mais aussi Y », em-dash per paragraph, uniform paragraph lengths. Full rules + checklist: [references/antislop-fr.md](./references/antislop-fr.md).

### 4. Pick the template

See [references/templates.md](./references/templates.md) for full skeletons. Summary:

| Type | Pattern | Length | Notes |
|------|---------|--------|-------|
| **Listicle pays/apéro** | "Apéritif X : 10 recettes…" | 6–8k chars | Proven format. Item H3s + intro per item. Link matching recipes. |
| **Ingrédient — histoire & origine** | "X en cuisine : tout savoir…" | 5–9k chars | Origin story → varieties → culinary uses → choose/store → 2–3 recipes → FAQ. Culinary angle only. |
| **Cuisine & culture** | "L'histoire de [plat]" | 6–10k chars | Migration web (see below), cultural meaning, authentic vs adapted, recipe links |
| **Ustensile / matériel** | "Guide / Comparatif…" | 6–9k chars | Affiliate priority ([monetization](../../../docs/seo-strategy/monetization.md)): comparison table, honest testing, care tips |
| **Livre de cuisine découvert** | "J'ai testé [livre]" | 4–6k chars | Why picked up, 3 tested recipes with notes, who it's for, Amazon link + disclosure |
| **Street food / voyage gourmand** | "Où manger / les meilleures adresses…" | 5–7k chars | Addresses + what to order + one homemade recipe link |
| **Technique (blog)** | "Comment / Astuces…" | 4–8k chars | Method, mistakes, FAQ; link up to the techniques pillar |

**The migration-web layer (the blog's signature).** Any template can carry a migration story — see [references/cuisine-toile-migrations.md](./references/cuisine-toile-migrations.md): 6 layers (ingredients, techniques, names, people, empires, infrastructures), 5 patterns (merge / split / status-flip / invented tradition / contested birth), 24 verified dish stories and 12 narrative templates with French hooks. Rules: open on the plate, one hero-fact per article, name the human carrier, show the legend then weigh the archive, no sermon, end on the living diaspora.

### 5. On-page checklist (every article)

Write in **Comark-valid markdown** from the start (JDC renders with `@comark/html` — load the `comark` skill for component syntax when using `::blocks`):

- **Title** ≤ 60 chars, exact query front-loaded, evergreen (no "pour l'été"), natural French — never "Recettes de plat Apéritif"
- **Meta description** 140–155 chars, exact query + benefit, written (not auto-generated)
- **Slug**: keywords only, hyphens, no dates/seasons — set explicitly to keep it stable
- **Excerpt**: 1–2 sentences (used as dek/fallback)
- **Structure**: intro 100–150 words with primary query in the first 2 sentences; H2 every ~300 words; H3 per listicle item
- **FAQ**: 3–5 questions from SERP PAA + "combien/comment" variants, near the end
- **Internal links ≥ 2**: pick REAL targets via jdc-cms MCP `list-recipes` / `list-articles` / `list-pages` — 1 up (hub: `/techniques-culinaires/**`, `/recette/recettes-du-monde`, category) + 1 sideways (related recipe/article). Contextual anchors, never "cliquez ici". Verify targets exist (no 404s — this has happened).
- **Images**: cover + alt text describing the dish; inline image per major section. Only reference media that exists in the library (`list-media`) — broken `/images/...` paths have shipped before.
- **Schema**: recipes get `Recipe` (YGG-82 pending — author/`recipeCuisine`/calories fixed at template level); listicles get `ItemList`; FAQ block → `FAQPage`

### 6. Review — two passes on the first draft

Never ship the first draft. Run two passes on the draft created in step 6 (via `update-article` / `upsert-seo`, slugs pinned), each producing a new `previewUrl`:

**Pass 1 — Correction (facts, structure, mechanics).** Objective only:
- [ ] **Facts vs sources**: every date, origin, quantity, cooking time, name checked against the research notes and URLs from steps 1–2 (legend stated as legend, archive as archive)
- [ ] **French**: grammar, spelling, agreements, punctuation (no AI-perfect uniformity either — natural but clean)
- [ ] **Comark syntax**: the body must be valid Comark markdown (JDC renders with `@comark/html`). Check: no unclosed `::component` blocks, valid props syntax, no raw HTML that the renderer drops, headings/list/image syntax intact, no escaped-entity garbage (`&amp;`, `&#x27;`) in the source. Load the `comark` skill for the exact syntax when in doubt — a broken component renders as raw text on the page.
- [ ] **Structure**: single H1; primary query in the first 2 sentences; ≥3 H2s in logical order; FAQ block present; listicle items consistent but varied in length
- [ ] **Links**: every internal link resolves (fetch each target — 404s have shipped before), no duplicate targets, anchors natural and varied
- [ ] **Images**: every referenced path exists in the media library (`list-media`) — dead `/images/...` references have shipped before; alt texts present
- [ ] **Metadata**: title ≤ 60 chars, description 140–155, excerpt set, keywords clean (no typos/junk), slug unchanged and stable

**Pass 2 — Amélioration (voice + SEO polish).** The rewrite pass:
- [ ] **Anti-slop 10-point checklist** (see [references/antislop-fr.md](./references/antislop-fr.md) §8): banned openers gone, no « il convient de », conclusion < 4 lines with an opinion, adjectives backed by facts, no triades, paragraph-length variation
- [ ] **Voice arsenal applied**: ≥1 verdict court (Curnonsky), ≥1 aparté in parentheses, physical cause where an adjective survived (« en dessous de 65 °C, les œufs gardent leur eau »), one migration-web story if the topic supports it ([references/cuisine-toile-migrations.md](./references/cuisine-toile-migrations.md))
- [ ] **Rhythm**: long/short alternation, 1 paragraph ends ≤ 6 words, read-aloud test passed (nothing you wouldn't say at table)
- [ ] **L'empreinte unique**: ≥1 detail only lived experience produces (the failure in v1, what the vendor said, the real price)
- [ ] **SEO polish**: exact query variants woven into H2s, internal anchor variety (no repeated exact-match anchors), one more natural internal link if a spot exists

Then run the **render check** on the final `previewUrl` (the draft must display correctly, not just exist):

- [ ] Preview returns **200** (no error boundary / Nuxt error page); title carries the `[PREVIEW]` prefix (expected — it disappears once published)
- [ ] Title + meta description in the HTML match the review result
- [ ] Single H1, all H2/H3 render as headings (no raw `##` or unrendered `::component` markers leaking as text — a visible `::` or `**` means broken Comark)
- [ ] Images load (no 502/404 — check at least cover + first inline image)
- [ ] Every internal link resolves; FAQ section renders
- [ ] No leftover placeholder, comment or template text

Then report **both** preview URLs to the human: v2 (corrected) and v3 (improved) — or the single v3 with a short changelog of what each pass changed. The human reviews; publishing stays manual.

### 7. Publish via jdc-cms MCP

1. `create-article` with `{ title, content (markdown), excerpt, slug, categoryId, coverBlobPathname, coverAltText, coverDescription }` — **status stays draft**
2. `upsert-seo` `{ contentType: 'article', contentId, description, keywords }`
3. Then run the two review passes above (step 6) on the draft
4. Report the final `previewUrl` + changelog to the human. **Never publish, unpublish, or schedule via MCP.** Recipes are draft-only (403 if live).
5. List categories with `list-article-categories` before setting `categoryId` — no `uncategorized`.

### 8. After the human publishes

- GSC `inspection_inspect` on the live URL → confirm indexing; `indexing_submit` to push
- **`nuxtseo` follow-up** (site `s_7a49d74f`):
  - `nuxtseo page scan <live-url> --site s_7a49d74f --yes --json` — post-publish scan (spends the Lighthouse limit: ask before running)
  - `nuxtseo search inspect <live-url> --site s_7a49d74f --fresh --yes --json` — requests a fresh Google inspection (uses inspection quota)
  - `nuxtseo annotations create --site s_7a49d74f --date "$(date -u +%F)" --title "Publié : <titre>" --yes --json` — marks the day so the next traffic move has a cause
  - `nuxtseo research rankings` / `research competitors` track how the new URL ranks over time
- Add the target query to the tracked list in [keyword-validation](../../../docs/seo-strategy/keyword-validation.md)
- If the topic already had GSC impressions, re-check `analytics_query` after 2 crawl cycles

## Monetization rules (light touch)

- **Ustensiles first** (Amazon et al.): gear guides, comparisons, "poêle adaptée" boxes on technique pages
- **Books**: Amazon links fine on monde/culture/cookbook reviews — always with *"Lien affilié"* disclosure
- **Never** on basic ingredients; rare specialties get one "où acheter" box max
