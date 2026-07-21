# Product features ↔ SEO

How planned product work supports **journalducuistot.fr** traffic and how SEO content supports product adoption.

**Related brainstorming:** glossary, allergen filters, food/country mini-game, AI recipe drafting from external sources.

---

## Feature map

| Feature | Primary SEO role | Content type | Phase suggestion |
|---------|------------------|--------------|------------------|
| **Glossaire culinaire** | Long-tail definitions, internal links | `/glossaire/:slug`, auto-links in markdown | Phase 3 (with ingrédients silo) |
| **Filtres allergènes** | Trust + niche (`sans gluten`, etc.) | Hub pages + recipe filters | Phase A flags → Phase B catalog |
| **Mini-jeu pays / plat** | Engagement, shares; limited SEO unless wrapped in editorial | `/jeux/...` optional `noindex` on pure game | After core silos stable |
| **Agent IA (sources)** | **Editorial velocity** (indirect SEO) | CMS-only drafts | Admin tool first; not public generator |

---

## Glossaire culinaire

**Search intent:** “c’est quoi…”, “définition…”, “comment utiliser…”

**SEO design:**

- Dedicated route (not only blog tags) for clean URLs and `DefinedTerm` / FAQ schema where appropriate.
- Cross-link from [techniques](./content-inventory.md) and [cuisine-santé articles](./content-inventory.md).
- Alias table for ingredient names → term (supports future ingredient hubs).

**Avoid:** Duplicate content with existing “tout savoir sur X” posts — **301 or merge** into glossary canonical URLs.

---

## Filtres allergènes

**Search intent:** “recette sans gluten”, “sans lactose”, EU 14 allergens.

**SEO design:**

- Phase A: recipe-level flags → hub pages (`/recette/sans-gluten`) with curated intros (indexable).
- Phase B: ingredient catalog → computed allergens + editor override.
- Copy: **indicatif** disclaimer (not medical advice).

**Schema:** Use `Recipe` suitableForDiet / allergen only when data is reliable.

**Synergy:** Glossary entries for allergen terms (gluten, fruits à coque).

---

## Mini-jeu (plat ↔ pays)

**Search intent:** Low for pure game; higher if bundled as “culture culinaire”.

**SEO design:**

- CMS-decked questions tied to `origin_country` on recipes (optional field).
- Public page with **intro article** (indexable) + game widget.
- Shareable score (UTM, newsletter) — retention, not core rankings.

---

## Agent IA (ebook, site, YouTube)

**Search intent:** None directly (admin productivity).

**SEO design:**

- Output → **draft recipes** with human publish workflow (existing CMS status).
- Structured fields match API (ingredients, steps, SEO block).
- Proposed allergens from ingredient list → feeds allergen silo.
- Store source URL + license note (audit; no verbatim republication of copyrighted books).

**Risk:** YMYL-adjacent if public “generate recipe” without review — keep **admin-only** for v1.

---

## Additional SEO-led features (no separate product)

| Idea | Fits existing content | Keyword angle |
|------|------------------------|---------------|
| Ingredient hub `/recette/ingredient/[slug]` | Recipes + glossary | “recette avec courgettes” |
| Country hub expansion | `recettes-du-monde`, apéro posts | “recettes [pays] faciles” |
| Comparatifs ustensiles | Matériel blog | “poêle fonte vs inox” |
| Tables conversions | Techniques / recipes | Snippet-friendly |
| Seasonal hubs | Marinades, grillades | Peak May–August |
| FAQ on technique pages | Techniques CMS | PAA for “comment saisir…” |

---

## Priority alignment

See [priorities and silos](./priorities-and-silos.md):

1. Techniques + import hygiene  
2. Glossary / ingrédients (SEO + editorial)  
3. Allergens Phase A  
4. AI draft assist (CMS)  
5. Game (engagement)

Revisit this table when a feature ships or when GSC reveals a query cluster (e.g. allergen or ingredient) that outperforms projections.
