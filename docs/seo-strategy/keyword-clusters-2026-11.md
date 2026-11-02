# Clusters de mots-clés — 2026-11

**Méthode:** GSC API (90 jours, 250 requêtes réelles) × DataForSEO FR (volume/difficulté) × contenu CMS live.
**Objectif:** page 1 sur les clusters à faible concurrence par silo (recette / article / page), puis attaquer les têtes pos 20-45.
**Doc lié:** [silos brainstorm](./silos-brainstorm-2026-11.md) — mécanisme niche → sous-hub → tête.

---

## 1. Les 6 clusters striking-distance (GSC, 90 jours)

### C1 — « Dessert africain » 🆕 (le trou à prendre)

| Signal | Valeur |
|---|---|
| DataForSEO | `dessert africain` **720/mois, diff 0** (+ variantes facile, rapide, fruits) |
| GSC | `dessert africain` 74 imp **pos 57.6** · `desserts africains` 14 pos 56.8 · `patisserie africaine` 8 pos 56.3 · `gateau africain` + `gateaux africains` + `gateau afrique` ~11 imp pos 42-55 · `patisserie africaine` 1 clic pos 56 |
| Total famille | **~110 imp / 3 mois, personne en page 1 du site** |

**Pourquoi on rate:** aucun contenu ne cible « dessert africain » — l'article #9 couvre « Afrique du **Nord** » seulement, alors que nos recettes sucrées du continent existent déjà : cornes de gazelle, chebakia, zlabia, m'hanncha (+ baklava voisin).

**Action (CMS):** créer la page **« Desserts africains »** (parent `null` → `/recette/desserts-africains`, 1 segment — voir contrainte flatten ci-dessous) : intro 300 mots + `::recipe-list` (cornes-de-gazelle, chebakia, zlabia, m-hanncha, baklava) + `::faq` (différence Maghreb/Afrique de l'Ouest, ingrédients, préparation à l'avance) + liens vers article #9 et le hub monde.

**Contrainte flatten:** le handler `/recette/[category]/[slug]` 301 toute URL à 3 segments → les nouvelles pages sous `/recette/**` doivent rester à **2 segments max** (parent `null` ou page `Recette`).

### C2 — Apéritif marocain (maillage posé, recul à confirmer)

`apéro marocain` 44 imp pos 12.8 · `apéritif marocain` 33 pos 13.9 · `aperitif marocain` 14 pos 11.4 · `apero marocain recette` 7 pos 10.6 · `apero maroc` 4 pos 10.3 · `apéritifs marocains` 3 pos 20.3 → **~105 imp, pos 10-20**.

Article #8 déjà cible + maillage ajouté le 30/10 (hub monde + pastilla). **Action:** rien de plus pour l'instant — surveiller 4 semaines (l'objectif pos ≤ 5 est jouable, concurrence faible).

### C3 — Fricadelle (la recette rank 28-60 sur sa propre famille)

`fricadelle` **43 imp pos 49.2** · `fricadelle recette` 9 pos 51.2 · `ingrédients fricadelle` 4 pos 59.8 · `cuisson fricadelle à la poêle` 3 pos 52 · `fricadelle maison` 3 pos **28.7**. Famille DataForSEO : **40 500/mois**.

**Action (recette #27):** enrichir l'intro (l'histoire Nord — la fricadelle de la côte belge), ajouter `::faq` (cuisson à la poêle vs four, ingrédients : pain-vache-œuf, différence boulette/fricadelle) + mention « maison vs industrielle ». Maillage déjà fait (listicle belge → recette ✓).

### C4 — Apéritif portugais (le pays sans maillage)

`apéritif portugais` 8 imp pos 46.8 · `apéro portugais` 7 pos 37.3 · `aperitif portugais` 1 pos 27 → ~18 imp pos 21-47.

**Action (recettes #65/#68/#71/#72/#69):** ajouter 1 lien article par 2-3 recettes portugaises publiées (bolinhos, pica-pau, peixinhos) vers le listicle [apéritif portugais](/blog/inspiration-culinaire/aperitif-portugais-10-recettes-faciles) — même pattern que le maillage marocain qui a fait reculer le dessert de 30.5 → 12.8.

### C5 — Marinade grillade (saisonnalité terminée)

`marinade pour grillade(s)` ~12 imp pos 32-37, article #19. Saison grillade terminée — noter pour **avril-mai 2027** (push saisonnier Phase 4).

### C6 — Conservation (déjà planifié)

`méthodes de conservation des aliments` 6 imp pos 90 — restructure P1 (audit §2.4), maillage pickles↔kimchi↔conservation après publication du 1er nov.

---

## 2. Les têtes-plats (ladders recettes déjà en place)

Gate DataForSEO (famille topic) vs page JDC :

| Tête (famille) | Vol topic | Diff | Page JDC | Ladder actif |
|---|---|---|---|---|
| `boeuf bourguignon` | **201 000** | 6 | boeuf-bourguignon-traditionnel ✓ | FAQ quantités à ajouter (même pattern moules) |
| `baklava` | 60 500 | 0 | baklava ✓ | lier depuis dessert africain (C1) |
| `pad thai` / `gyoza` | 60 500 | — | pad-thai ✓, gyoza ✓ | lier depuis cuisine asiatique (live 5 nov) |
| `fricadelle` | 40 500 | 0 | les-fricadelles (C3) | enrichissement |
| `cornes de gazelle` | 27 100 | 0 | corne-de-gazelle ✓ | lier depuis dessert africain (C1) |
| `pastilla` | 18 100 | 0 | pastilla ✓ | maillage marocain fait |
| `recette pates` | 18 100 | — | hub pâtes **live 2 nov** | 12 recettes liées ✓ |

Ces têtes ne se gagnent pas directement — elles se gagnent par les variantes `recette {plat}` + le cluster qui densifie.

---

## 3. Ordre d'exécution recommandé

1. **C1 Desserts africains** — page neuve, 1 h, diff 0, notre plus gros striking-distance jamais vu (110 imp à pos 40-58, zéro page cible).
2. **Moules FAQ** — fait le 31/10 ✓ (à surveiller GSC).
3. **C3 Fricadelle enrichissement** — 30 min.
4. **C4 Maillage portugais** — 20 min.
5. **C6 Conservation restructure** — 1 h (P1 déjà listé).
6. C5 marinade — avril 2027.

---

## 4. Pourquoi ça marche (le ladder)

Les 34 requêtes striking-distance ci-dessus totalisent ~450 imp / 90 j — petit, mais chaque cluster gagné en page 1 : (a) capte le volume niche, (b) pousse le sous-hub qui rank alors sur la moyenne (« cuisine africaine », « sauce pour pâtes » 4 400), (c) le sous-hub pousse le hub sur la tête (« recettes du monde » pos 7.4, « recette pâtes » 18 100). C'est exactement le pattern qui a fait passer `dessert afrique du nord` de pos 30.5 → 12.8 en 3 semaines après le maillage du 30/10.
