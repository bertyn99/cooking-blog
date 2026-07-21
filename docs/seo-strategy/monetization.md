# Monetization strategy

**Status:** Living document  
**Last updated:** 2026-07-21  
**Site:** [journalducuistot.fr](https://journalducuistot.fr)  
**Locale:** `fr-FR`

Revenue options for a French recipe + techniques blog, aligned with [content silos](./priorities-and-silos.md) and existing stack (`nuxt-umami`, AdSense client prepared but **commented** in `apps/web/nuxt.config.ts`).

## Strategic bias: ustensiles over ingrédients

**Default:** prioritize **kitchen equipment and tools** for affiliation, not per-ingredient links.

| | Ustensiles & matériel | Ingrédients & épices |
|--|------------------------|----------------------|
| **Intent** | Research / purchase (comparatifs, “quel poêle…”) | Often pantry staples, low basket, price-sensitive |
| **Commission** | Higher average order (poêle, robot, couteau) | Low unit price, frequent out-of-stock on Amazon |
| **Trust** | Natural on [matériel blog posts](./content-inventory.md) + [techniques](./content-inventory.md) | Feels spammy if every recipe line is affiliate |
| **SEO fit** | Matches existing `materiels-ustensils` + technique pages (saisir, grillade, fonte) | Better as **editorial** (“où trouver X”) on glossary/rare items only |
| **Refresh** | Products stable for years | Links rot, regional SKUs |

**Ingredient exceptions (still light touch):**

- Specialty items (nuoc-mâm, épices rares) in **one** “où acheter” box per article.
- Gift guides / books (Amazon) on **monde** and **culture** topics.
- No affiliate on basic produce (oignon, tomate, etc.).

---

## Revenue channels (priority order)

Suggested order for current traffic stage (see [SEO baseline](./README.md#context)):

| Priority | Channel | When |
|----------|---------|------|
| 1 | **Affiliation ustensiles** | Now — extend existing gear content |
| 2 | **Email + occasional sponsor** | After signup CTA exists |
| 3 | **Sponsored articles / brands** | When mediakit + Umami/GSC stats exist |
| 4 | **Display ads (AdSense)** | After consent CMP + acceptable CWV; meaningful sessions |
| 5 | **Digital products** | When techniques / apéro silo is authoritative |
| 6 | **Ingredient / épice affiliate** | Sparse, editorial only |

---

## 1. Affiliation — ustensiles (core)

### Content types to monetize

| Existing / planned content | Affiliate angle |
|----------------------------|-----------------|
| Poêles, fonte, indispensables débutant | Amazon.fr, Fnac/Darty-style programs if joined |
| Techniques: saisir, grillade, friture | “Poêle adaptée”, thermomètre, grille |
| Marinades / BBQ (seasonal) | BBQ tools, planches |
| Comparatifs (to write) | Fonte vs inox vs céramique; couteaux; robots |

### Programs (FR — verify terms before joining)

| Program | Use for |
|---------|---------|
| **Amazon Partenaires** (amazon.fr) | Poêles, livres, petit électro, accessoires |
| **Retail affiliates** (e.g. Boulanger, Darty — each has own rules) | High-ticket kitchen |
| **Brand direct** (Le Creuset, etc.) | When traffic justifies outreach |
| **Knife / specialty** | Niche posts only |

### Editorial rules

- **One primary recommendation** + 1–2 alternatives per guide (honesty helps conversion).
- Link **technique → gear** and **gear → technique** (internal + affiliate).
- Place CTAs after the reader understands *why* (problem/solution), not in the first paragraph.
- Use `rel="sponsored"` or `nofollow` per program requirements (Amazon often `nofollow` + tag).
- **Disclosure** on every page with paid/affiliate links (see [Legal & disclosure](#legal--disclosure-fr)).

### Recipe pages

- Default: **no** ingredient-level Amazon links.
- **Ustensiles** block on each recipe (CMS `recipe_utensils`): name, optional note, optional `affiliateUrl` per tool — primary affiliate surface on recettes.
- Optional sidebar remains deprecated in favor of the structured ustensiles list.

---

## 2. Affiliation — ingrédients (secondary)

Use only when it adds value:

- Glossary / “tout savoir sur…” for **non-supermarket** products.
- Single **encart** “Où acheter” (épicerie fine, marque partenaire épices).
- Avoid competing with reader’s local market for daily groceries.

---

## 3. Display advertising

**Stack today:** AdSense script stub in `apps/web/nuxt.config.ts` (commented); `@nuxtjs/partytown` enabled for future third-party scripts.

**Before enabling:**

- [ ] RGPD consent (marketing cookies for personalized ads).
- [ ] Ad slots that do not break recipe UX (mobile especially).
- [ ] Measure CWV before/after (SEO Pro / Lighthouse).

**Placements (if enabled):**

- Long **techniques** and **blog** articles: mid-content, sidebar desktop.
- **Recipes:** below intro or between steps — sparingly.
- Avoid ads inside ingredient lists or print-friendly recipe blocks.

**Expectation:** Modest FR RPM until volume grows; do not optimize the whole site for ads at low traffic.

---

## 4. Sponsored content & brands

Strong fit for **inspiration culinaire** (apéro), **techniques** (poêle sponsor), **monde**.

| Format | Disclosure |
|--------|------------|
| Article sponsorisé | “Contenu réalisé avec…” en tête |
| Recette partenaire | Marque + produit intégré au story |
| Newsletter slot | “Partenaire de la semaine” |

Keep **editorial veto** (no off-brand products). Track in a simple spreadsheet (brand, date, fee, URL).

---

## 5. Email & digital products

- **Newsletter:** recettes + 1 technique; optional **one** gear pick (affiliate) or sponsor mention.
- **PDF / ebook:** “Techniques essentielles” or apéro — sell via Gumroad / Lemon Squeezy / Stripe; can include gear list with affiliate links inside.
- **Premium** (later): seasonal menus — low priority until list size is known.

---

## 6. Other (optional)

- YouTube / Shorts (off-site AdSense + links to comparatifs ustensiles).
- **Guides gourmands:** travel affiliates secondary; keep focus food + recettes maison.
- Local ateliers / consulting — only if personal brand is part of the site.

---

## Legal & disclosure (FR)

Not legal advice — implement with counsel if needed.

| Requirement | Practice |
|-------------|----------|
| **Transparence affiliation** | Visible notice: links may earn commission; price unchanged for reader |
| **Publicité / sponsoring** | Label sponsored posts clearly (ARPP / influencer practice in FR) |
| **RGPD** | Consent for non-essential cookies (ads, some affiliate trackers) |
| **Amazon** | Follow **Operating Agreement** (identification, link format, no misleading claims) |
| **Mentions légales** | Update site legal page if monetization model changes |

**Suggested short disclosure (FR):**

> Certains liens sur cette page sont des liens affiliés : si vous achetez via ces liens, nous pouvons percevoir une commission, sans surcoût pour vous. Nous ne recommandons que du matériel que nous jugeons utile en cuisine.

Place in footer + repeat at top of **buying guides** and sponsored posts.

---

## Technical notes (monorepo)

| Item | Location / action |
|------|------------------|
| Analytics | `nuxt-umami` — use for mediakit pageviews |
| AdSense | Uncomment `apps/web/nuxt.config.ts` head script when ready; keep Partytown |
| Affiliate URLs | Prefer env or CMS snippet for tag rotation; avoid hard-coding secrets |
| Future CMS field | Optional `affiliateBlocks` on articles (gear picks) — not implemented yet |

---

## Program & placement tracker (template)

Copy into a spreadsheet or fill as you join programs.

| Program | Status | ID / tag | Best for | Notes |
|---------|--------|----------|----------|-------|
| Amazon Partenaires FR | | | Poêles, livres, accessoires | Primary gear |
| | | | | |
| Brand / retail | | | Comparatifs | |
| AdSense | Prepared | `ca-pub-…` in nuxt config | Display | Disabled |
| Sponsor direct | | | Apéro, techniques | |

---

## Alignment with SEO roadmap

| SEO asset | Monetization focus |
|-----------|-------------------|
| [Techniques culinaires](./content-inventory.md) | Poêles, thermomètres, BBQ — **primary** |
| [Matériel blog](./content-inventory.md) | Comparatifs, Amazon + retail — **primary** |
| Apéro / monde | Sponsors, books, light ingredient encarts |
| Cuisine-santé / glossaire | Rare ingredients only; no supplement affiliate push |
| Recipes | Minimal ads; optional small “matériel” block |

Update this doc when a program is signed, AdSense goes live, or disclosure copy is published on the site.
