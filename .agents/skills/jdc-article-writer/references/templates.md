# Article templates — Journal du Cuistot

Skeletons per article type. All in French, Bertyn's voice (see SKILL.md §3). Adjust length to SERP reality: cover the intent contract, then beat competitors on the gap (usually: history/origin + honest testing + FAQ).

Shared rules:
- Primary query in the first 2 sentences of the intro and in the title.
- One H2 per idea; H3 per listicle item (`## ` / `### ` in markdown).
- FAQ block (3–5 Q) near the end, sourced from SERP `people_also_ask` + "combien/comment" variants.
- End with internal links already placed in the body (not a link dump): 1 up (hub/pillar) + 1–2 sideways (recipes/articles).
- Tables where data helps (quantities, temps, comparatifs) — they win snippets.

---

## 1. Listicle pays / apéro — "Apéritif X : 10 recettes…"

**Query pattern:** `apéritif [pays]`, `apéro [pays]`, `amuse-bouche [pays]` — proven format (the site's top organic asset).

```
Title:      Apéritif [pays] : 10 recettes de bouchées faciles
Intro:      [pays]'s apéro culture in 2–3 lines + what makes it different
            (primary query in first sentence). No "bienvenue dans".
H2 x10:     1. [Nom de la bouchée] — H3 in the list version
            Per item: 1 image markdown standard from the media library (match
            list-media against each dish; skip + note items without
            media) + ~500 chars: what it is, where it comes from,
            taste/texture, when to serve. Link the matching JDC recipe
            when one exists ("→ Notre recette maison :").
Section:    "Comment composer un plateau [pays]" — 3–4 pairing lines
FAQ:        Qu'est-ce qu'un apéritif [pays] ? / Que boire avec ? /
            Quoi acheter déjà prêt ? / Comment anticiper la prep ?
Schema:     ItemList (10 items, position + url)
Links out:  /recette/recettes-du-monde (up) + matching recipes + sister
            country listicles
```

**Differentiation lever:** one "côté histoire" line per item (origin of the bite) — competitors list recipes without context.

## 2. Ingrédient / épice — histoire & origine — "X en cuisine : tout savoir…"

**Query pattern:** `X en cuisine`, `tout savoir sur X`, `comment utiliser X`.

```
Title:      [X] en cuisine : tout savoir sur … (culinary frame, never health)
Intro:      first encounter / what surprised you about X
H2: Origine et histoire       — where it comes from, how it spread
                                (trade routes, empires, why it matters)
H2: Les variétés (ou formes)  — table: variété / goût / usage
H2: Comment l'utiliser        — dosages, when to add during cooking,
                                pairings (3–4 concrete dishes)
H2: Bien choisir et conserver — selection, storage, shelf life
H2: Recettes avec [X]         — 2–3 internal links to JDC recipes
FAQ:                          — from PAA + dosage/substitution questions
Length:     5–9k chars
Links out:  ingredient sibling articles + recipes + techniques pillar
```

**Refframe rule:** never "bienfaits pour la santé" positioning (wrong SERP). If research surfaces health facts, one culinary-adjacent line max.

## 3. Cuisine & culture — "L'histoire de [plat]"

**Query pattern:** `histoire [plat]`, `[plat] origine`, `pourquoi [plat]`, `[plat] traditionnel`.

```
Title:      [Plat] : histoire et origine d'un classique
Intro:      the mystery/hook — "tout le monde le connaît, personne ne
            sait d'où il vient"
H2: D'où vient [plat] ?     — earliest trace, disputes between regions
H2: Comment il a voyagé     — migrations, colonies, cookbooks
H2: La version authentique vs les adaptations
H2: [Plat] aujourd'hui      — where to eat it / how JDC makes it
FAQ:                        — region of origin, differences, sides
Length:     6–10k chars
Links out:  the recipe(s) + country listicle + recettes-du-monde hub
Schema:     Article + FAQPage
```

This is the strongest differentiation format: competitor recipes pages rarely do history well.

## 4. Ustensile / matériel — "Guide / Comparatif"

**Query pattern:** `meilleurs [ustensile]`, `[ustensile] vs [ustensile]`, `comment choisir [ustensile]`, `ustensiles débutant`.

```
Title:      [Ustensile] : comment choisir (guide [année sans — evergreen])
Intro:      the buying confusion, stated honestly
H2: Les critères qui comptent vraiment (matière, poids, prix)
H2: Comparatif — TABLE: modèle / matière / usage / prix indicatif
H2: Par profil              — débutant / régulier / passionné
H2: Entretien et durée de vie
FAQ:                        — inox vs antiadhésif, culotter, garantie
Affiliate:  Amazon links on each rec + "Lien affilié" disclosure near
            the first link. Ustensiles-first per monetization strategy.
Length:     6–9k chars
Links out:  sister gear guides + technique pages that use the tool
```

## 5. Livre de cuisine découvert — "J'ai testé [livre]"

**Query pattern:** `livre cuisine [thème/pays] avis`, `meilleur livre [cuisine]`.

```
Title:      J'ai testé [titre du livre] : avis et 3 recettes à faire
Intro:      why you picked it up (gift, discovery, author you follow)
H2: L'objet en main        — format, photos, level required
H2: 3 recettes testées     — H3 per recipe: what worked, what you
                             changed, photo of YOUR result
H2: Pour qui ?             — beginner / advanced, price point
H2: Verdict                — honest note + who should skip it
Affiliate:  Amazon link + disclosure.
Length:     4–6k chars
Links out:  a JDC recipe in the same cuisine + the country hub
```

## 6. Street food / voyage gourmand — "Où manger…"

**Query pattern:** `meilleur [mets] [ville]`, `street food [ville]`, `où manger [plat] [ville]`.

```
Title:      Où manger les meilleurs [mets] à [ville]
Intro:      the search you did on the ground, what disappointed you
H2 xN:      one per address — what to order (specific dish), price range,
            neighborhood, why it's worth it
H2: Faire maison à la place — link the JDC recipe version
FAQ:        budget, reservation, best time to go
Length:     5–7k chars
Links out:  related street-food articles + the homemade recipe
```

## 7. Technique / astuces (blog) — "Comment / Astuces…"

**Query pattern:** `comment [faire X]`, `astuce [problème]`.

```
Title:      Comment [résoudre le problème] : la méthode simple
Intro:      the failure mode everyone knows
H2: Pourquoi ça rate       — the science, short
H2: La méthode pas à pas   — numbered steps
H2: Les erreurs à éviter   — table or list
FAQ:                       — variants and troubleshooting
Length:     4–8k chars
Links out:  UP to /techniques-culinaires pillar page + 3–5 recipes
            using the technique (this is the PageRank hub work)
```

## 8. Saisonnel / événement — "Recette [fête/saison]"

**Query pattern:** `recette [fête]`, `menu [événement]` (Ramadan, Noël, été…).

Same skeleton as listicle, but: publish **6–8 weeks before the event** (Google needs lead time), refresh yearly (update `updatedAt`, re-submit indexing), internal-link to the previous year's winners.

---

## 9. Histoire de plat / migration — "L'histoire de…"

**Query pattern:** `histoire [plat]`, `[plat] origine`, `pourquoi [plat]` — the strongest differentiation format (recipe sites rarely do history well).

Use the [migration-web framework](./cuisine-toile-migrations.md): pick ONE of the 12 narrative templates (T1–T12) and ONE hero-fact, then 2–3 of the 6 layers. Verified stories ready for 24 dishes (tempura, vindaloo, bánh mì, phở, pad thaï, couscous, harissa, croissant, bœuf bourguignon, pizza…).

```
Title:      [Plat] : l'histoire méconnue / d'où vient vraiment…
Intro:      open on the reader's plate, then detonate the hero-fact
            (« Votre tempura préféré porte le nom d'un jeûne catholique. »)
::timeline  — the chronology as a frise block (5–6 dated items;
            block syntax at the end of this file)
H2: La légende            — tell the myth properly (it's part of the dish)
H2: Ce que disent les archives — dates, carriers, the merge/split
H2: [Plat] aujourd'hui    — the living diaspora (end on the web)
::table     — key dates or quantities in a styled table (optional)
FAQ:                      — origine, différences régionales, accompagnement
Length:     6–10k chars
Links out:  the recipe(s) + country listicle + recettes-du-monde hub
Schema:     Article + FAQPage
```

Signature move: **the legend is part of the dish's history** — tell it, then show the archive. Never mock the myth.

Any other template (listicle, ingrédient) can carry a migration story as an enrichment layer: one « côté histoire » block per item, sourced from the framework.


## Illustration blocks (Comark)

Three styled blocks exist for articles/recipes (JDC design: stone neutrals, amber accents, Merriweather headings):

- `::timeline{items='[{"date":"1680","title":"…","text":"…"}]'}` then `::` — chronologic frise (template 9: one item per date, text ≤ 2 lines)
- `::table{head='["A","B"]' rows='[["1","2"]]' caption="…"}` then `::` — quantities, comparatifs, key dates (striped, amber header)
- `::carousel{images='[{"src":"uploads/x.png","alt":"…"}]'}` then `::` — 2–6 images with descriptive alts (arrows + dots)

Close every block with `::`. JSON goes inside single-quoted Comark attrs — no unescaped single quotes inside strings. Render check after writing: no raw `::block` text visible on the preview (occurrences inside the `<script>` hydration payload are fine).
