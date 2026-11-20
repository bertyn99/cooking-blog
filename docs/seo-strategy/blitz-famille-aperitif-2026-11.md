# Blitz famille « apéritif » — hub + déclinaisons pays

> Complète `blitz-aperitif-marocain-2026-11.md` (Blitz 1, en cours). Répond à : comment grimper sur
> « apéritif » ET ses déclinaisons, sans s'éparpiller.

---

## 1. Le constat, sur données live (28 j, 14/11)

### La famille apéritif* du site

| Page | Imp. | Clics | Pos | État |
|---|---|---|---|---|
| #8 apéritif **marocain** | 384 | 6 | 10,8 | Blitz 1 en cours (J21 = règle d'arrêt) |
| #16 apéritif **belge** | 353 | 31 | 6,2 | **gagné** (top 7) — viser top 5 |
| #34 apéritif **portugais** | 45 | 1 | 13,0 | **Blitz 2** — même pattern que le belge |
| hub `/recette/aperitif` (#24) | **0** | **0** | — | **invisible pour Google** |

Total famille : **782 imp / 38 clics** — la famille fait déjà 79 % des impressions du site.

### Les têtes génériques : refusées, chiffres à l'appui

| Requête | Volume FR | SERP page 1 (relevé 14/11) | Verdict |
|---|---|---|---|
| amuse-bouche | 9 900 | Pinterest, Marmiton, CuisineAZ, Annie, 750g | **refusé** — autorité trop faible |
| verrine apéritif | 6 600 | Marmiton, CuisineAZ, YouTube, Pinterest | **refusé** |
| apéritif dînatoire | 6 600 | Marmiton, CuisineAZ, Annie, Pinterest ×2 | **refusé** (déjà mordu : diff DataForSEO 0 ≠ SERP réel) |
| apéritif noël | 9 900 | saisonnier déc. | **refusé comme cible**, exploité via les satellites (fekkas, verrines de harira…) |

« apéritif » seul = passé de liqueur (pastis, kir). L'intention bouchées vit dans « apéritif {pays} »,
« amuse-bouche {pays} », « bouchée apéritif ». C'est là qu'on gagne.

---

## 2. La stratégie : un hub qui existe, des satellites qui gagnent

**Règle : 1 seul Blitz actif à la fois.** Le marocain finit à J21 ; le portugais démarre ensuite.

### Cible 0 (gratuit, cette semaine) — réparer le hub #24

Le hub est le seul endroit qui peut capter le générique sans affronter Marmiton de front :
ses longues traînées propres (« apéritif du monde », « bouchée apéritif par pays », « que servir
apéritif ») et il redistribue l'autorité vers les satellites.

- [x] **Le vrai bug était ailleurs : le hub était en `noindex, follow`** (seoMeta #361). D'où 0 impression. Remis `index, follow` le 14/11 via `upsert-seo` (`metaRobots: ""`). C'est la seule retouche qui compte.
- [x] Section « Le même apéro, pays par pays » : 7 paragraphes courts, une ligne de contexte par pays, 7 liens articles (Portugal était absent — #34 jamais lié par le hub). Ancres variées (« bouchées marocaines », « bouchées portugaises »…), plus de liste sèche.
- [x] Meta 148 c avec les pays nommés ; keywords → `apéritif du monde`, `amuse-bouche par pays`, etc. (les requêtes que le hub peut gagner, pas `apéritif dînatoire`).
- [x] Title inchangé (47 c, déjà exact). Vérifié en prod 14/11 : robots `index, follow`, Portugal lié, H2 rendu, 15 images.
- [ ] Lier chaque satellite depuis son paragraphe (fait pour le hub → satellites ; reste le retour : satellites → hub).

### Cible 1 (J21 du Blitz 1 → J14 du Blitz 2) — apéritif portugais #34

Même protocole que le marocain : diagnostic prod (title/meta/H2/quantités/FAQ), gate mot-clé
(`apéritif portugais` 2-3 imp GSC + volumes DataForSEO), SERP relevé avant réécriture.
Le belge est parti de pos 22 → 6,2 avec ce protocole. Le portugais part de 13 : gain plus rapide.

Longues traînées à capter dans le corps : `apéritif portugais facile`, `bouchée apéritif portugais`,
`amuse-bouche portugais`, `que boire apéritif portugais` (le vinho verde fait l'angle).

### Cible 3 — les déclinaisons pays, une par mois, jamais deux

Ordre par demande prouvée + fenêtre : **libanais** d'abord, puis italien, espagnol, grec. Chaque
article suit le gate complet (GSC ou nuxtseo avant rédaction). Ils entrent dans le programme v2, pas
dans ce sprint.

Gate libanais **fait le 18/11** (détail : `keyword-validation.md`). Il change la cible : `apéritif
libanais` ne fait que 90/mo et son SERP renvoie des résultats anglais/espagnols — la demande FR vit
sur **`mezzé libanais` 5 400/mo** et `recette mezzé libanais` 480. `apéritif oriental facile` (590)
passe en secondaire. Dépendance bloquante : le CMS n'a qu'**une** recette levantine (houmous #56) —
3 recettes minimum (falafel, taboulé, labneh) avant d'écrire le listicle, sinon on refait le défaut
de #8 (des bouchées sans page).

---

## 3. Calendrier compressé — tout clos au 31 décembre

> Contrainte humaine : le sprint famille entier tient entre le 14/11 et le 31/12. Le marocain
> rétrécit de 30 à 21 jours ; le portugais n'a que 17. Les repères sont recalés en conséquence —
> un top 5 portugais au 31/12 n'est **pas** promis ; ≤ 8 l'est si le pattern belge se répète.

### Fenêtre 1 — 14 → 20 nov : hub + marocain posé

| Jour | Livrable |
|---|---|
| 14-15 nov | ✅ On-page marocain J1-J5 poussé · menu pour 6 ajouté · 1re mesure GSC |
| 15-16 nov | **Hub #24** : title/meta réécrits, une section par pays (2 lignes + 3 bouchées), liens satellites dans le corps |
| 17 nov | Lien retour hub → depuis #16 et #34 (le marocain l'a déjà) |
| 18-20 nov | Rituel quotidien : 1 lien neuf, 1 micro-retouche, relevé GSC · **20/11 : mesure 1 marocain + hub** |

### Fenêtre 2 — 21 nov → 4 déc : marocain J21 (règle d'arrêt), portugais réécrit

| Jour | Livrable |
|---|---|
| 21-23 nov | **Portugais #34 : diagnostic prod** (title/meta/H1/H2/quantités/FAQ/images) + gate mot-clé GSC/nuxtseo + relevé SERP |
| 24-26 nov | Réécriture #8 du protocole marocain appliquée au portugais · push `update-article` + `upsert-seo` |
| 27-28 nov | Maillage : hub → portugais (corps), portugais → hub + belge (1 lien), 2 recettes portugaises si elles existent |
| 1-4 déc | Rituel · **4 déc = J21 marocain : pos ≤ 7 tenu ?** Si pos > 9 → STOP retouches, pivot recettes marocaines (briouates, zaalouk, msemen) |

### Fenêtre 3 — 5 → 19 déc : consolidation + saisonnier

| Jour | Livrable |
|---|---|
| 5-12 déc | Rituel sur les deux cibles · 1 micro-retouche max/page/semaine · GSC re-soumission hebdo (mardi) |
| 5-12 déc | **Saisonnier sans nouvelle page** : les requêtes `apéritif noël` (9 900/mo) sont servies par le contenu existant — vérifier que fekkas, verrines de harira et le hub parlent « fête » ; sinon 1 phrase, pas un article |
| 15 déc | **Mesure 2** : marocain (J30 compressé à J30réel = 14 déc) + hub + portugais (J1+10) |

### Fenêtre 4 — 20 → 31 déc : décision libanais ou arrêt

| Jour | Livrable |
|---|---|
| 20-31 déc | Rituel allégé (relevé GSC + 1 lien) — les retouches on-page s'arrêtent, Google digère |
| 22 déc | **Décision libanais** : les DEUX conditions sinon rien — marocain ≤ 7 ET portugais ≤ 9. Si oui : brouillon local avant le 31 (rédaction complète en janvier, publication fin janv. — jamais entre Noël et le jour de l'an). Cible corrigée le 18/11 : **`mezzé libanais`**, pas `apéritif libanais` (gate fait, voir §2). Prérequis : 3 recettes levantine publiées avant rédaction |
| 31 déc | **Mesure finale famille** : le tableau §4 se remplit, bilan écrit dans le journal, cibles 2027 posées |

### Ce que la compression coûte (dit franchement)

- Le portugais perd 13 jours : objectif réaliste **≤ 8-9** au 31/12, pas top 5. Le top 5 portugais, s'il vient, viendra en janvier sans qu'on y touche.
- La règle « un pays ne se lance que si le précédent est top 7 » est **suspendue** pour le portugais (déjà publié, pos 13 — c'est une consolidation, pas un lancement). Elle tient pour le libanais.
- Entre Noël et le jour de l'an : rien ne se publie, rien ne se modifie. Le 31/12 = mesure et bilan seulement.

---

## 4. Journal (les deux cibles sur un seul tableau)

| Date | Page | Pos | Clics | Imp. | Changement du jour | Note |
|---|---|---|---|---|---|---|
| 2026-11-14 | #8 | 10,8 | 6 | 384 | baseline | Blitz 1 lancé J1-J5 |
| 2026-11-14 | #16 | 6,2 | 31 | 353 | — | gagné, surveiller sans retoucher |
| 2026-11-14 | #34 | 13,0 | 1 | 45 | baseline | Blitz 2 à J21 |
| 2026-11-14 | hub | — | 0 | 0 | **noindex trouvé et retiré** + section « pays par pays » (7 liens, Portugal ajouté) + meta 148 c | C'était le bug : le hub n'était pas indexable. Le 17/11, retours satellites → hub. |
| 2026-11-18 | libanais | — | 0 | 0 | **Gate YGG-264 fait** : cible corrigée en `mezzé libanais` (5 400/mo) | `apéritif libanais` 90/mo, SERP EN/ES → pas une cible. Manque 3 recettes levantine. |
| 2026-11-20 | #8 | 11,5 (7j) | 9 | 159 | — | Cible J7 ≤ 10 non tenue mais fenêtre 7 j encore chargée de pré-blitz. Le vrai juge = J21 (4 déc). |
| 2026-11-20 | #16 | 4,7 (7j) | 14 | 115 | — | continue de remonter sans qu'on y touche. |
| 2026-11-20 | #34 | **7,5 (7j)** | 0 | 21 | — | 13,0 → 7,5 en 6 jours (21 imp : échantillon petit, à confirmer). Cible 15 déc ≤ 11 déjà atteinte. |
| 2026-11-20 | hub | — | 0 | 0 | **2e bug trouvé** : absent des sitemaps XML depuis le 6 août (`exclude: '/recette/**'` sur le sitemap pages éjectait aussi toutes les pages CMS racine `recette` — hub, boissons, desserts, pâtes, pickles, cuisines Asia/EU). Fix `nuxt.config.ts` local, **déployé seulement quand la facture GitHub est réglée** | Le dé-noindex du 14/11 ne pouvait rien donner sans signal sitemap. Vérifier après deploy : hub dans pages.xml, et PAS de doublon dans recipes.xml. |

---

## 5. Repères de réussite (dates calendaires)

| Date | Marocain #8 | Portugais #34 | Hub | Lecture |
|---|---|---|---|---|
| 20 nov | ≤ 10 (faisait 10,8) | — | ≥ 10 imp/sem. | le hub commence à être vu |
| 4 déc | **≤ 7** sinon STOP retouches | — | ≥ 20 imp/sem. | J21 marocain : pivot recettes si > 9 |
| 15 déc | ≤ 6 | ≤ 11 (partait de 13) | ≥ 30 imp/sem. | le pattern pays se confirme |
| 31 déc | ≤ 5 | ≤ 8 | ≥ 50 imp/sem. | 2 pays ≤ 8 + hub vivant = sprint réussi |

**Ce que la famille doit produire :** 60-90 clics/mois au 31/12 (contre 38 aujourd'hui), juste
avant le pic Ramadan (18 fév.) qui gonfle toutes les requêtes « apéritif {pays} » oriental.

---

## 6. Ce que cette stratégie ne fait pas

- Pas de page « amuse-bouche », « verrine », « apéritif dînatoire » — trois fronts perdus d'avance.
- Pas de nouveau pays pendant la fenêtre (le libanais se décide le 22 déc., se rédige en janvier).
- Pas de retouche sur #16 (belge) : gagné = on ne touche pas.
- Rien ne se publie et rien ne se modifie entre Noël et le jour de l'an.

## 7. Le rituel quotidien (15 min, non négociable)

1 lien interne neuf ou re-vérifié vers une cible de la famille · 1 micro-retouche on-page max,
tracée dans le journal · relevé GSC (1 min) · re-soumission GSC 1×/semaine (mardi).

Partages contextuels (S3 du protocole) : groupes Facebook cuisine marocaine et communautés
lusophones de France — en participant, jamais en déposant un lien nu. 2-3 sur toute la fenêtre,
pas plus.
