# Recettes levantine — gate du 18/11/2026

Trois recettes prérequises au listicle « Mezzé libanais » (YGG-264). Linear refuse de nouvelles
issues (limite du plan gratuit) : les specs vivent ici et en annexe de YGG-264.

**Constat CMS** : une seule recette levantine publiée — houmous maison (#56), + houmous de betterave
(#63) en draft. Rien d'autre. GSC 3 mois : **0 impression** sur `falafel`, `taboul`, `labneh` →
aucun concurrent interne, aucune cannibalisation possible.

---

## 1. Falafel — `recette falafel libanaise` (1 300/mo)

| Requête | Volume | GSC |
|---|---|---|
| `recette falafel libanaise` (+ 6 variantes) | 1 300 | 0 |
| `recette de falafel` | 880 | 0 |
| `recette falafel au four` | 720 | 0 |
| `falafel recette facile` | 590 | 0 |
| `recette avec falafel` | 480 | 0 |

**SERP** `recette falafel libanaise` : recipes carousel + AI overview + PAA. Page 1 = blogs et
particuliers (Les délices de Manel, Julie Andrieu, Overblog). **Marmiton et CuisineAZ absents du
top 7** — c'est la plus gagnable des trois.

⚠️ La graine `falafel` seule est polluée par les enseignes (`falafel near me` 8 100, `le roi
falafel`, `maoz falafel`). Ne jamais cibler ces requêtes.

**Contrat d'intention (ce que tout le monde couvre)** : pois chiches, herbes, épices, cuisson,
sauce tahini.
**Écart à prendre** : pois chiches **secs** trempés 12 h (la boîte rend la pâte molle — plan B
chiffré, sans mentir), pâte grossière et non purée, repos 30 min, thermomètre 170 °C, variante four.

---

## 2. Taboulé libanais — `recette taboulé libanais` (8 100/mo)

| Requête | Volume |
|---|---|
| `recette taboulé libanais` (4 formulations) | 8 100 |
| `taboulé recette traditionnelle` | 6 600 |
| `taboulé recette de grand-mère` | 5 400 |
| `taboulé recette facile` | 3 600 |

**SERP** : recipes carousel + AI overview + PAA + vidéo. **Marmiton en position 2** — front direct.

**Angle obligatoire** : le vrai taboulé libanais est une **salade d'herbes** (persil majoritaire,
menthe, très peu de bourghol), pas de la semoule aux tomates. C'est l'écart culturel que Marmiton ne
traite pas. Ratio chiffré, essorage des herbes, version française assumée comme variante.

---

## 3. Labneh — `recette labneh` (2 900/mo)

| Requête | Volume |
|---|---|
| `recette labneh` (2 formulations) | 2 900 |
| `labneh libanais` | 590 |
| `labneh zaatar` / `zaatar labneh` | 480 |
| `fromage labneh` | 170 |

**SERP** : AI overview + recettes + PAA + vidéo. Page 1 = Ottolenghi, blogs, fromage maison.
Aucune tête de média FR → winnable.

**Angle** : yaourt entier + sel, 12-24 h d'égouttage, **rendement chiffré** (X g de yaourt → Y g de
labneh), le petit-lait réutilisé, conservation réelle, zaatar comme usage et non comme recette.

---

## Ordre d'exécution

1. **falafel** (fait le 18/11 en draft) — sert aussi de maillage au listicle.
2. **labneh** — le plus court, 3 ingrédients, rendement pédagogique.
3. **taboulé** — le plus gros volume mais le front est plus dur.

Rappel : `create-recipe` ne publie jamais. Publication manuelle humaine dans l'admin.

---

## État d'exécution

### 1. Falafel — draft 105 (18/11)

`id 105`, slug `recette-falafel-libanaise`, catégorie Entrée, 4 portions, 35 min.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=recette-falafel-libanaise

- Titre 58 c · meta 150 c (`recette falafel libanaise maison` en tête) · excerpt 140 c.
- 14 ingrédients glossaire (pois chiches secs, tahini, épices), 5 ustensiles, nutrition, 11 étapes `step`.
- Cover + 1 photo de corps (pois chiches frits en gros plan) — les recettes n'ont pas de galerie,
  la 2ᵉ photo importée (`47559d8d…-pexels-31610388`) reste libre pour le listicle mezzé.
- Angle tenu : pois chiches secs 12 h, pâte grossière, repos 30 min, friture 170 °C, variante four,
  plan B boîte assumé comme dépannage. Rien de « recette facile » survendu.
- Reste à faire à la publication : lien entrant depuis houmous #56 et depuis l'article mezzé.

**Bug frontend trouvé au passage** : les unités s'affichaient en enum brut (`1 cuillere_cafe`) sur
toutes les recettes, houmous compris. Corrigé dans `app/components/recipe/Ingredients/Element.vue`
(labels français + décimales à la virgule). Le rendu prod ne changera qu'au prochain déploiement.


### 2. Labneh — draft 106

`id 106`, slug `recette-labneh`, Entrée, 6 portions (mezze), 10 min + 12-24 h d'égouttage.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=recette-labneh

- Titre 60 c · meta 154 c (`recette labneh maison` en tête, rendement chiffré) · excerpt 128 c.
- 5 ingrédients (yaourt entier, sel, huile d'olive, zaatar, menthe), 4 ustensiles, 6 étapes.
- Angle tenu : la version fausse (fromage blanc + citron) est nommée et écartée dès l'intro,
  rendement 1 kg → 400 g (12 h) / 350 g (24 h), petit-lait réutilisé, conservation réelle,
  zaatar traité comme usage. Le yaourt grec est donné comme raccourci honnête (4-6 h), pas comme équivalent.
- Glossaire créé : Yaourt entier (308), Zaatar (309), Étamine ou filtre à café (310), Passoire (311), Bocal en verre (312).

### 3. Taboulé libanais — draft 107

`id 107`, slug `recette-taboule-libanais`, Entrée, 6 portions, 25 min.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=recette-taboule-libanais

- Titre 58 c · meta 150 c (`recette taboulé libanais traditionnel`) · excerpt 132 c.
- 10 ingrédients, 4 ustensiles, 7 étapes.
- Angle tenu : « le taboulé que j'ai mangé pendant vingt ans était une salade de semoule » →
  ratio 100 g persil / 30 g menthe / 30 g bourghol / 300 g tomates pour 6. Les deux causes du
  taboulé détrempé sont traitées en étapes (herbes séchées, bourghol gonflé au citron, tomates égouttées).
- Glossaire créé : Bourghol fin (313), Essoreuse à salade (314), Planche à découper (315).

### Ce qui reste à faire à la publication (humain)

1. Publier 105, 106, 107 dans l'admin — rien n'est publié par le MCP.
2. Ajouter les liens entrants : houmous #56 → falafel, labneh, taboulé ; et les trois entre eux.
3. Alors seulement écrire l'article « Mezzé libanais » (YGG-264), qui garde le choix, l'histoire
   et les quantités par personne — pas les étapes.
