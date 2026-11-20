# Portugais #34 — diagnostic blitz (20/11/2026, J7)

Issue YGG-263. Diagnostic tiré 4 jours tôt (calendrier : 21-23 nov diagnostic, 24-26 nov
réécriture, 27-28 nov maillage). Rien n'est poussé au CMS aujourd'hui : le contenu v2 vit
dans `article-portugais-v2.md` et se pousse au début de la fenêtre 24-26 nov — idéalement
mardi 24 ou mercredi 25, jour de re-soumission GSC.

## 1. Gate mot-clé (volumes DataForSEO loc 2250, 20/11)

| Requête | Volume | Diff | GSC 3 m (page #34) | Verdict |
|---|---|---|---|---|
| `apéritif portugais` | 390 | 0 | 7 imp, pos 43 (moy. 3 m) | **tête** — même volume que `apéritif marocain` |
| `apéritif portugais alcool` | 90 | 0 | — | FAQ + H2 boissons |
| `apéritif portugais facile` | 70 | — | 2 imp, pos 70 | title/excerpt |
| `petiscos` | **480** | 0 | — | vocabulaire SERP — le mot qui gagne |
| `tapas portugaise` | 210 | 0 | 4 imp, pos 11-33 | H2/FAQ déjà traitées (pos 11 sur `tapas portugais recette`) |
| `recette apéritif portugais` | 20 | — | — | longue traîne |
| `alcool portugais` | 1 000 | 0 | — | **hors sujet** (spiritueux, pas apéro) — ne pas cibler |
| `dessert portugais` | 4 400 | 0 | — | hors sujet |

GSC 3 m page #34 : 1 clic / 112 imp / pos moy 19,1 — mais **7 j récents : pos 7,5** (21 imp,
0 clic). La page répond déjà aux liens hub→#34 posés le 14/11.

## 2. SERP `apéritif portugais` (20/11, live)

Features : AI overview + PAA + images + recipes + short videos. Page 1 :

1. « Apéritif portugais : 10 recettes de petiscos (tapas) express » — le concurrent gagnant
   met **petiscos (tapas)** dans le title
2. « Top 15 des "petiscos", les "tapas portugaises" » — plats nommés en liste
3. « Top 15 des entrées, tapas (petiscos) portugaises »
4. agrégateur de recettes portugaises (rissóis, pâté de thon…)
5-9. blogs épicerie/tasca, recettes isolées (rissóis)
10. 750g

**Lecture : la page 1 parle petiscos, avec des plats nommés.** Notre title actuel
« 10 recettes faciles et savoureuses » est le plus générique du top 10. Nos H3 portent déjà
les bons noms de plats (pastéis de bacalhau, rissóis, peixinhos…) — c'est notre force, elle
n'apparaît nulle part dans le title.

## 3. Audit #34 (contenu actuel)

**Déjà solide (garder) :**
- Intro Bertyn avec le retournement tempura (peixinhos → Nagasaki) : différenciant, garder tel quel
- 10 items, chacun avec sa recette liée (bolinhos-de-bacalhau, ameijoas, gambas, pica-pau,
  tremocos, sardinhas, caldo-verde, peixinhos, rissois) — le maillage recettes est **déjà fait**
- SEO description 143 c déjà orientée petiscos ✓
- Liens vers espagnol, italien, marocain, friture, grillade ✓

**Manques vs protocole marocain (ce qui a fait passer #8 et #16) :**
1. **Title générique** (55 c) : « 10 recettes faciles et savoureuses » — aucun plat nommé,
   pas de petiscos, pas de promesse chiffrée.
2. **Aucune quantité par personne** — seule exception : sardinhas (6-8). Le H2 « combien »
   + table + callout qui font convertir #8 n'existent pas.
3. **FAQ en prose** (H2 « FAQ » + 4 H3) — pas de bloc `::faq`, donc pas de FAQPage schema.
4. **Zéro lien vers le hub `/recette/aperitif`** et zéro lien vers le belge #16 (le hub
   pointe vers #34 depuis le 14/11, pas l'inverse).
5. 4 images AI (`-genere`) sur 10 : sardinhas remplacée par une vraie photo Pexels (6872184,
   sardines embrochées sur braises, importée `47af1576-…-pexels-6872184.webp`). Pica-pau,
   queijo et peixinhos : aucun candidat stock valide (re-ranker : 0 keep) → on garde les
   images existantes, qui sont au moins sur le sujet.

## 4. Plan v2 (contenu dans `article-portugais-v2.md`)

| # | Changement | Où |
|---|---|---|
| 1 | Title « Apéritif portugais : 10 pétiscos faciles avec les quantités » | `update-article` |
| 2 | Meta 150 c avec « quantités par personne » + plats nommés | `upsert-seo` |
| 3 | H2 « Combien de pétiscos prévoir par personne ? » + `::table` + callout pour six | après le H2 culture |
| 4 | 1 phrase quantité par item (9 items, sardinhas déjà faite) | corps |
| 5 | FAQ prose → `::faq` 5 items (4 existantes + « à l’avance » ; l’alcool absorbe `apéritif portugais alcool` 90/mo) | fin |
| 6 | Lien hub `/recette/aperitif` dans le corps + belge #16 dans le bloc final | maillage |
| 7 | Image sardinhas → photo Pexels réelle | item 6 |

**Ce qu'on ne touche pas :** intro (tempura), ordre des 10 items, noms des H3 (ancres de
ranking), liens recettes, H2 boissons. La page est à pos 7,5 — on consolide, on ne
reconstruit pas.

## 5. Fenêtre de poussée

- **Mar. 24 ou mer. 25 nov** : `update-article` (title + contenu) puis `upsert-seo` (meta) ;
  render check preview ; re-soumission GSC même jour.
- 27-28 nov : vérifier les liens retours (hub→#34 déjà fait ; #34→hub/belge dans la v2).
- 15/12 : mesure — cible pos ≤ 11. 31/12 : ≤ 8.

Journal : la mesure J7 (20/11) est dans `../blitz-famille-aperitif-2026-11.md` §4.
