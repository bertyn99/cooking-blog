# Contenu Février — gates du 21/11/2026

Trois contenus créés en draft pour la fenêtre Chandeleur / Mardi gras. Le candidat
`recette crepes` a été **refusé** au SERP, et `nouvel an chinois` écarté pour intention
non culinaire — même logique que `menu de noel`.

| Candidat | Volume | Diff | Pic saisonnier | Verdict |
|---|---|---|---|---|
| `pâte à crêpes` | **301 000** | **9** | **823 000 fév** / 201 000 nov | ✅ recette #110 |
| `chandeleur` | **74 000** | 9 | **450 000 janv** / 368 000 fév | ✅ article #54 |
| `mardi gras` | **49 500** | **0** | **368 000 fév** / 110 000 janv | ✅ article #55 |
| `recette crepes` | 673 000 | 18 | 1 500 000 fév | ❌ page 1 = Marmiton, Hervé Cuisine, 750g, Louis Tellier — front perdu |
| `nouvel an chinois` | 49 500 | 2 | 368 000 fév | ❌ SERP 100 % encyclopédique / presse, intention non culinaire |
| `beignets` | 27 100 | 0 | 74 000 fév | ⏸ réserve — SERP recettes + blogs, plus concurrentiel que les deux articles |
| `crepes suzette` | 40 500 | **0** | 49 500 oct | ⏸ réserve (aucun pic février, demande plate) |
| `galette bretonne` | 22 200 | **0** | 27 100 fév | ⏸ réserve (proche de la galette des rois, à ne pas cannibaliser) |

**Le vrai gisement de février n'est pas `recette crepes` mais `pâte à crêpes`** : 301 000/mo à
difficulté 9, contre 673 000/mo à difficulté 18. Le site n'avait aucune page crêpes.

## 1. Recette pâte à crêpes — draft 110

`id 110`, slug `pate-a-crepes`, catégorie Dessert (1), 4 portions (12 crêpes), 10 min prep +
20 min cuisson, easy.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=pate-a-crepes

- Gate : `pâte à crêpes` 301 000/mo (nuxtseo 2250, diff 9), pic 823 000 en février.
  SERP : Marmiton, Hervé Cuisine, 750g, blogs — mais aucun concurrent ne traite la **texture**
  (repos, grumeaux, détente de la pâte), qui est l'angle retenu.
- Contract d'intention couvert : proportions (250 g farine / 4 œufs / 500 ml lait / 50 g beurre),
  ordre farine → œufs → lait en trois fois, beurre fondu tiède (pas brûlant), repos 1 h minimum,
  correction de texture avant cuisson, température de poêle (goutte d'eau en perles),
  cuisson 1 min 30 / 30 s, maintien au chaud sous torchon, conservation 24 h / congélation
  avec papier cuisson, ~500 kcal pour 3 crêpes.
- Glossaire : 38 farine T45, 80 œufs, 69 lait entier, 5 beurre, 109 sucre, 101 sel, 317 rhum
  ambré ; ustensiles 127 saladier, 225 fouet, 302 louche, 122 poêle. Stub créé : **325 Crêpière**.
- Images : Pexels — cover `39412995` (pile dorée), corps `1467562` (pâte au fouet, dans l'intro).
  ⚠️ `pexels-photo-9415` renvoie un fichier vide (21 octets) — ne pas réutiliser.
- Liens internes : aucun lien sortant ajouté dans le corps (l'article Chandeleur fait le lien
  entrant). Cible des liens de #54 et #55.
- SEO id 535 · title 50 c · meta 149 c ✓.
- Contrainte MCP : `create-recipe` ne persiste pas `step` → markdown numéroté poussé via
  `update-recipe`. Vérifié au render (8 étapes, 0 fuite d'énumération d'unités).

**Fenêtre de publication : 1–2 février**, en même temps que l'article Chandeleur.

## 2. Article Chandeleur — draft 54

`id 54`, slug `chandeleur-pourquoi-crepes`, catégorie Gastronomie & Culture (3), ~10 800 c.
Preview : https://journalducuistot.fr/preview?type=article&slug=gastronomie-culture%2Fchandeleur-pourquoi-crepes

- Gate : `chandeleur` 74 000/mo (diff 9), pic 450 000 janvier / 368 000 février.
  SERP : encyclopédique (Wikipédia, presse régionale, sites de mairie) — **aucun concurrent
  éditorial culinaire**. C'est le template qui gagne déjà sur le site (bûche, bredele, vin chaud).
- Angle : la fête de la lumière (40 jours après Noël, Jérusalem IVe s., Égérie, glissement au
  2 février quand Rome fixe Noël au 25/12) → la légende des Lupercales et de Gélase Ier
  **explicitement contestée** (pas de source contemporaine) → pourquoi des crêpes (forme,
  économie, pièce) → le rituel exact, y compris la **contradiction des sources sur la main**
  → ce qu'on mange vraiment (froment vs sarrasin, galette/crêpe en Bretagne, crêpe Suzette)
  → proverbes météo → fête de l'ours du Haut-Vallespir → pont vers Mardi gras.
- Faits vérifiés : Chandeleur = 40 j après Noël ; née à Jérusalem (Égérie, IVe s., 14 fév) ;
  Gélase Ier + crêpes aux pèlerins = légende non documentée ; Lupercales = hypothèse fragile ;
  sources contradictoires sur la main qui tient la pièce ; 2 février 2027 = mardi ;
  Mardi gras 2027 = 9 février.
- Blocs : `::timeline` (5 jalons, IVe s. → 2 février 2027), `::faq` (6 questions, FAQPage).
- Images : Pexels cover `3939680` (pile de crêpes, sucre glace + pistaches), corps `13427907`
  (crêpes à la confiture et aux prunes).
- Liens internes : `/recette/pate-a-crepes` (×2), `/recette/desserts-du-monde`.
- SEO id 536 · title 56 c · meta 145 c ✓.
- Preview vérifiée le 22/11 : 7 h2, timeline rendue, FAQPage, liens `/recette/pate-a-crepes`
  et `/recette/desserts-du-monde` actifs. Les 404 observés ce jour-là venaient d'un slug de
  test erroné (`chandeleur-pour-crepes`) — le slug réel est `chandeleur-pourquoi-crepes`.
  Même cause pour #53 : il est en catégorie **Inspiration Culinaire (5)**, pas Gastronomie
  & Culture, donc `gastronomie-culture/mezze-libanais` ne résout pas. Aucun bug de preview.

## 3. Article Mardi gras — draft 55

`id 55`, slug `mardi-gras-beignets-carnaval`, catégorie Gastronomie & Culture (3), ~8 900 c.
Preview : https://journalducuistot.fr/preview?type=article&slug=gastronomie-culture%2Fmardi-gras-beignets-carnaval

- Gate : `mardi gras` 49 500/mo (diff **0**), pic 368 000 février / 110 000 janvier.
  SERP encyclopédique, aucun concurrent culinaire.
- Angle : la fête du garde-manger qu'on vide (pas une fête du beignet) → calcul de la date
  mobile (47 j avant Pâques, 9 février 2027, Cendres le 10) → `carnem levare` → la friture
  comme geste de la dernière heure (170–180 °C, bain, grille) → tour de France des noms
  (bugnes, merveilles, oreillettes, bottereaux, tourtisseaux, foutimassons) + étymologie
  *bunia* → carnavals (Dunkerque, Nice, Limoux) et fête de l'ours → l'après-Cendres.
- Blocs : `::timeline` (5 jalons, Antiquité → 9 février 2027), `::faq` (6 questions, FAQPage).
- Images : Pexels cover `39551167` (pile de beignets), corps `6746524` (faworki / merveilles).
- Liens internes : `/recette/beignets-de-fleurs-de-courgettes` (publiée), `/recette/pate-a-crepes`
  (draft #110), `/blog/gastronomie-culture/chandeleur-pourquoi-crepes` (draft #54),
  `/recette/desserts-du-monde` (publiée).
- SEO id 537 · title 59 c · meta 151 c ✓.

## ⚠️ Bug Comark : `:::` avale la fin de l'article

Constaté au render check du 21/11 : l'article #54 s'arrêtait au `timeline`, tout le texte
suivant (dernière section, liens internes, FAQ) disparaissait — et la FAQPage aussi.

Cause : le bloc était ouvert avec **trois** deux-points (`:::timeline{items=…}`) et fermé avec
`::timeline`. Avec un opener `:::`, le parseur Comark traite le reste du document comme le corps
du bloc ; avec un closer `::timeline`, il fait pareil. **Syntaxe correcte :**

```md
::timeline{items='[{"date":"…","title":"…","text":"…"}]'}
::
```

**Deux articles publiés étaient touchés** — donc tronqués en ligne depuis leur publication :

| Article | Publié le | Coupé après | Réparé le |
|---|---|---|---|
| Bûche de Noël #50 | 4 nov | timeline → FAQ + liens + 2 sections perdus | 21/11 |
| Panettone #49 | 17 nov | timeline → callout + FAQ + liens perdus | 21/11 |

Correction appliquée en place (contenu uniquement, aucun changement de statut) : opener
`::timeline`, closer `::`, et suppression de la liste à puces dupliquée qui suivait le timeline
de #50. Vérifié en ligne : FAQPage présent, texte final rendu, liens actifs sur les deux pages.
Les pages CMS (`:::` dans 5 pages) n'ont pas été touchées : elles passent par `PageMarkdown`,
et leur rendu n'a pas montré de troncature.

## Ordre de publication (proposition)

| Fenêtre | Contenu | Statut |
|---|---|---|
| 1 fév | **Article Chandeleur #54** | draft — à publier |
| 1–2 fév | **Recette pâte à crêpes #110** | draft — à publier (même jour que #54) |
| 2 fév | **Article Mardi gras #55** | draft — à publier (liens croisés vers #54 et #110) |

**Dépendance de publication groupée** : #55 pointe vers #54 et #110, #54 pointe vers #110.
Publier la recette d'abord (ou le même jour), sinon les liens internes renvoient un 404 sur un
lien interne — le défaut exact corrigé sur #8 (7 bouchées sans page).

Réserve : `crepes suzette` (40 500, diff 0) et `galette bretonne` (22 200, diff 0) restent des
cibles ouvertes pour une vague ultérieure, sans pic février.
