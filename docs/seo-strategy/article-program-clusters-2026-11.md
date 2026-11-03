# Programme articles — clusters & sujets (2026-11, v2)

**Objet :** sujets d'articles **guides/listes/menus** (pas de plats), issus des clusters de mots-clés.
**Sources :** GSC API 12 mois (1000 requêtes × pages, clusterisées) × autocomplete Google (validation de demande exacte) × inventaire CMS.
**Limite connue :** DataForSEO **indisponible** le 03/11 (`provider_payment_required`) → volumes/difficulté **PENDING**. Step 0 du programme = re-mesurer chaque seed à la reprise du provider avant d'écrire (skill jdc-article-writer §1 : ne pas garder un mot-clé non confirmé).
**Doc lié :** [keyword-clusters-2026-11](./keyword-clusters-2026-11.md) (les 6 clusters C1-C6 d'octobre restent valables, croisés ici).

---

## 1. Ce que Google nous montre déjà (GSC 12 mois, demandes réelles)

Clusters agrégés sur 1000 requêtes (triées par impressions) :

| Cluster famille | Imp 12m | Nb requêtes | Best pos | Page qui rank | Diagnostic |
|---|---|---|---|---|---|
| dessert africain | **2792** | 52 | 7.8 (variante « nord ») | article #9 | cœur « dessert africain » pos 60-70 → hub live 03/11, spokes à créer |
| apéritif marocain | **1656** | 68 | 10.6 | listicle | aux portes de la page 1 |
| apéritif belge | **1216** | 40 | 8.6 | listicle | bien placé, tenir |
| fricadelle | **712** | **136** | 33 | recette | la famille la plus fragmentée : cuisson/ingrédients/maison |
| crevettes grises | **408** | 60 | **83.8** | recette à la bière | invisible malgré 60 variantes — recette, « que faire avec », cuisson |
| apéritif portugais | **368** | 44 | 11.0 | listicle | comme le marocain, portes de page 1 |
| gaufres salées | **240** | **92** | 74 | recette fromage-légumes | invisible ; 92 variantes (fromage, légumes, pâte feuilletée…) |
| pâtes italiennes types | **112** | **56** | 70 | article listicle | existe mais pos 56-97 — refresh + ItemList |
| marinades grillades | 64 | 16 | 32.5 | article #19 | saisonnier (avr.-mai 2027) |
| boissons africaines | 64 | 20 | 38.5 | article #18 | refresh candidat |
| bouchées à la reine | 16 | 16 | 86 | recette | garniture/cuisson/accompagnement |
| houmous (conservation) | 4 | 4 | 36 | recette | « durée conservation houmous maison » |

**Lecture :** Google nous offre déjà 6 familles > 350 imp/an sur des sujets où nous avons du contenu invisible ou à la porte de la page 1. C'est la matière première du programme.

---

## 2. Le programme — sujets d'articles prioritaires

### P1 — La demande existe déjà chez nous (GSC) → capitaliser d'abord

#### A1. « Types de pâtes italiennes » — REFRESH de l'article existant
- **Évidence GSC :** 56 requêtes (types/sorte/liste/nom/tous les types…) pos 56-97, 112 imp — le plus grand écart demande/présence sur un contenu qui existe déjà.
- **Sujet :** guide des formes + quelles sauces vont avec (table forme → sauce), ItemList schema (P2 backlog), FAQ (« quelle pâte pour la carbonara ? »).
- **Maillage :** hub [recettes-de-pates](/recette/recettes-de-pates) (live) + articles pâtes.
- **Effort :** refresh (structure + FAQ + schema), pas de rédaction à zéro.

#### A2. « Crevettes grises » — guide choisir / cuire / que faire avec
- **Évidence GSC :** famille 408 imp, 60 requêtes pos 84 ; **autocomplete** : « que faire avec des crevettes grises (+ cuites, décortiquées, un reste) », « comment choisir les crevettes ».
- **Sujet :** article-guide (choisir — grise vs rose, tailles ; cuire ; 10 idées avec restes) qui capte l'intention « idée » pendant que la [recette à la bière](/recette/crevettes-grises-a-la-biere) capte « recette ». Enrichir la recette en FAQ cuisson/temps.
- **Maillage :** hub recettes du monde + listicle apéritif belge (crevettes grises = pureté de la mer du Nord).

#### A3. « Gaufres salées » — la pâte de base et les idées
- **Évidence GSC :** 92 requêtes pos 74+ (fromage, légumes, comté, végétariennes, « pâte feuilletée »).
- **Sujet :** article-guide pâte de base + 10 déclinaisons (fromage/légumes/herbes), FAQ gaufre vs waffle. La recette existante reste la page « recette complète » — l'article capte « idées/que garnir ».
- **Maillage :** listicle apéritif belge (gaufre = croisement belge).

#### A4. Fricadelles — enrichissement de la recette (pas d'article)
- **Évidence GSC :** 712 imp, 136 requêtes ; **autocomplete** : « cuisson des fricadelles à la poêle », « au four », **« air fryer »**, « composition ».
- **Action :** FAQ dans la recette (poêle vs four vs air fryer, ingrédients, fricadelle vs boulette) + intro nord. (Déjà C3 d'octobre, famille confirmée par l'analyse 12 mois.)

#### A5. Bouchées à la reine — enrichissement recette
- **Évidence GSC :** 16 requêtes (garniture, accompagnement, cuisson) pos 75-98.
- **Action :** FAQ garniture originale + accompagnement + réchauffe dans la recette.

#### A6. Desserts africains — les spokes du hub
- **Évidence GSC :** famille 2792 imp, cœur « dessert africain » pos 60-70, hub live depuis le 03/11.
- **Action :** articles spokes (cornes de gazelle « origine » déjà pos 1 sur la requête origine !, thiakry draft #46, zlabia…) maillés vers [desserts-africains](/recette/desserts-du-monde/desserts-africains).

#### A7. Conservation des aliments — restructure (C6 déjà planifié)
- **Évidence GSC :** `méthodes de conservation des aliments` pos 90 ; `durée conservation houmous` pos 36 ; **autocomplete** : congélateur/sous vide/frigo.
- **Action :** restructure [conservation-aliments](/recette/recettes-du-monde/…) (audit §2.4) en guide par famille d'aliment + tableau durées.

### P2 — Sujets guides validés autocomplete (demande qualitative, à chiffrer au retour du provider)

#### A8. « Par quoi remplacer les épices » — LE guide des substitutions
- **Évidence autocomplete :** « par quoi remplacer les épices **de cajun / à paella / à couscous / à chili / gyros** » — une requête par mélange d'épices.
- **Sujet :** guide de substitutions (table épice/mélange → remplacants maison) — **synergie directe avec la série ingrédients** (10 articles FAQ déjà écrites : garam masala, nuoc-mâm…). Un seul article agrège un cluster démultiplié.
- **Maillage :** les 10 articles ingrédients + article épices essentielles (africaine, indienne) + les-epices-essentielles-en-cuisine (page).

#### A9. « Apéritif dinatoire » — le guide transversal
- **Évidence :** GSC (`apéro dinatoire marocain` pos 8.5, `apero dinatoire portugais` pos 20) + autocomplete (idée, pas cher, été, recettes).
- **Sujet :** guide d'organisation (quantités par personne, theme, avancer la veille) qui **télescope les 3 listicles pays** (marocain/belge/portugais, tous pos 8-11) — le hub manquant de la famille apéritif.

#### A10. « Menu marocain pour invités » — le guide de menu complet
- **Évidence :** GSC (`entrée marocaine avant tajine` pos 50.7, `avant couscous` pos 66.7, `repas marocain pour invité` pos 17) + autocomplete (`idée menu marocain pour invité`).
- **Sujet :** guide d'enchaînement complet (entrée → tajine/couscous → dessert → boisson) avec les recettes existantes du silo. Format réplicable : « menu [pays] pour invités » → repétition mexicain/italien/asiatique selon silos.

#### A11. « Temps de cuisson » — le guide de référence
- **Évidence autocomplete :** œuf dur, haricots verts, tomates farcies, poulet au four — méga-cluster générique. Nos pages techniques (methodes-de-cuisson…) ne rank nulle part.
- **Sujet :** page-guide « temps de cuisson par aliment » (table par famille : œufs, légumes, viandes, pâtes, riz) — cible long terme, très compétitive en tête mais longue traîne quasi libre (chaque ligne = une requête).
- **Pré-requis :** volume/difficulty à mesurer + décider recette vs technique page vs article.

#### A12. Boissons africaines — refresh de l'article #18
- **Évidence GSC :** famille 64 imp pos 38.5 (20 requêtes) + bissap en autocomplete.
- **Action :** refresh voix/FAQ + liens bissap (recette live) + hub boissons du monde.

### P3 — Saisonner (calendrier)
- **Marinades grillades** (A#19, pos 32.5) : push avril-mai 2027 (C5 d'octobre confirmé par l'analyse 12 mois).

---

## 3. Règles d'exécution

1. **Gate obligatoire avant chaque article :** volume + difficulté nuxtseo à la reprise du provider (Step 0). Un sujet sans volume confirmé reste en P2.
2. **Format guide, pas plat :** choisir/cuire/remplacer/durées/idées/menus — les recettes restent dans le silo recettes.
3. **Anti-cannibalisation :** article guide ↔ recette se partagent l'intention (« choisir/que faire » vs « recette ») — jamais le même head-term ; maillage croisé systématique.
4. **Schémas :** FAQPage partout ; ItemList sur les listes (A1, A2, A3, A9) ; Recipe reste aux recettes.
5. **Maillage :** chaque guide renvoie vers son hub silo + 2-3 articles de la série ingrédients quand le sujet touche un ingrédient.

---

## 4. Ordonnancement proposé (dès que le gate est possible)

| # | Sujet | Format | Type d'action | Pourquoi ce rang |
|---|---|---|---|---|
| 1 | Pâtes italiennes | refresh + ItemList | A1 | 56 requêtes déjà là, contenu existant — ROI le plus court |
| 2 | Crevettes grises | article guide + FAQ recette | A2 | 408 imp invisibles, autocomplete riche |
| 3 | Par quoi remplacer les épices | article guide | A8 | démultiplie la série ingrédients (10 FAQ déjà écrites) |
| 4 | Apéritif dinatoire | article guide hub-famille | A9 | 3 listicles pos 8-11 à télescoper |
| 5 | Gaufres salées | article idées + pâte de base | A3 | 92 requêtes invisibles |
| 6 | Menu marocain pour invités | article guide menu | A10 | requêtes pos 17-66, format réplicable |
| 7 | Fricadelles / bouchées à la reine | FAQ recettes | A4-A5 | enrichissements courts |
| 8 | Conservation | restructure page | A7 | déjà planifié audit §2.4 |
| 9 | Desserts africains spokes | articles | A6 | hub live, spokes au fil des recettes |
| 10 | Temps de cuisson | page-guide référence | A11 | gros cluster, tête compétitive — long terme |
| 11 | Boissons africaines | refresh | A12 | famille modeste |
