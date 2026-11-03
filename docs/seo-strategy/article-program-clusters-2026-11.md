# Programme articles — sujets par template (2026-11)

**Objet :** sujets d'articles alignés sur les **9 templates validés** du site ([templates.md](../../.agents/skills/jdc-article-writer/references/templates.md)). Pas de plats hors template.
**Sources :** inventaire des 44 articles par template × autocomplete Google (demande exacte) × clusters GSC 12 mois × [framework migrations](../../.agents/skills/jdc-article-writer/references/cuisine-toile-migrations.md) (24 histoires vérifiées prêtes).
**Limite :** DataForSEO down le 03/11 (`provider_payment_required`) → volumes/difficulté **PENDING**. Step 0 : re-mesurer chaque seed avant d'écrire.

---

## 0. Couverture actuelle par template (44 articles)

| Template | Couvert | Trous identifiés |
|---|---|---|
| 1 · Listicle pays apéro | espagnol, français, italien, marocain, belge, portugais, sud-africain | libanais, antillais, tunisien, indien, japonais, vietnamien, turc, grec |
| 2 · Ingrédient/épice | coriandre, igname, patate douce, curcuma, garam masala, gombo, basmati, cumin, girofle, cardamome, curry, nuoc-mâm | gingembre, safran, ras el hanout, vanille, sumac, miso, tahin |
| 3/9 · Histoire de plat | moules-frites seul | **24 histoires vérifiées prêtes, 0 publiée** |
| 4 · Ustensile/comparatif | 5 guides (débutants, poêles, fonte, indispensables, pâtisserie) | 0 comparatif « meilleur X » (monetization gap) |
| 5 · Livre testé | 0 | à faire selon lectures réelles |
| 6 · Où manger | Londres, Paris ×2, marchés | selon voyages réels |
| 7 · Technique/astuces | épices, marinades ×3, organisation | couvert par les pages techniques CMS |
| 8 · Saisonnel | 0 | Ramadan, Noël, Chandeleur, galette, nouvel an chinois |

**Clusters GSC 12 mois déjà identifiés** (voir §annexe) : apéritif marocain (1656 imp, pos 10.6), belge (1216, pos 8.6), portugais (368, pos 11) → les 3 listicles existants sont à la porte de la page 1 : le levier de différenciation du template 1 (une ligne « côté histoire » par bouchée) est le push.

---

## 1. Template 9 — Histoire/migration : les 24 histoires PRÊTES (différenciation maximale, recherche déjà faite)

Le framework a vérifié 24 récits (origine → route → merge/split) avec les hooks FR. Demandes autocomplete confirmées :

| # | Sujet (histoire) | Autocomplete | Étang du site | Framework |
|---|---|---|---|---|
| H1 | **Couscous** : l'histoire | « histoire couscous », « couscous histoire et origine », « histoire du couscous algérien » | silo cuisine africaine + plat préféré des Français | T8 : querelle 4 pays → UNESCO commune 2020 |
| H2 | **Harissa** : d'où vient vraiment | « origine harissa », « harissa origine pays/nom » | silo africain, Tunisie 1er exportateur | T9 : piment post-1492 + mortier *harasa* ; UNESCO 2022 |
| H3 | **Bœuf bourguignon** : origine | « origine boeuf bourguignon » (+ recette/nom) | **recette live** ✓ | T7 flip : restes → Escoffier → Julia Child ; Mme Saint-Ange 1928 |
| H4 | **Falafel** : origine | « origine falafel » (+ pays, boulette) | houmous live ✓, cluster Levant | T8 querelle Égypte/Levant |
| H5 | **Tajine** : histoire | « histoire tajine marocain » | silo africain | T10 + T6 : nom grec *tágēnon*, four portable berbère |
| H6 | **Croissant** : histoire | « histoire croissant » (+ viennois) | viennoiserie | T4 : légende 1683 vs archives Zang 1839 ; aller-retour France↔Vienne |
| H7 | **Pizza** : histoire | « histoire pizza » (+ margherita) | — | T7 : lazzari → reine 1889 → mondial |
| H8 | Pad thaï / tempura / bánh mì / baklava | 1 suggestion chacune — **demande FR fine** : garder pour plus tard | pad thaï live ✓, gyoza/rouleaux ✓ | prêtes dans le framework |

**Ordre conseillé :** H1 couscous → H2 harissa → H3 bourguignon (recette live = maillage immédiat) → H4 falafel → H5 tajine → H6 croissant. Chacun : `::timeline` 4-6 dates, légende puis archives, FAQ origine/différences/accompagnement, Article+FAQPage.

## 2. Template 4 — Ustensiles : les comparatifs (monetization #1)

Tous validés avec variantes commerciales (« 2026 », « qualité prix », « induction ») — **aucun comparatif n'existe sur le site**, 5 guides sans affiliation :

| # | Sujet | Autocomplete | Synergie site |
|---|---|---|---|
| U1 | **Meilleur air fryer** | 10 (+ 2026, qualité prix) | requêtes air fryer déjà vues dans la famille fricadelle (GSC) |
| U2 | **Meilleur couteau de cuisine** | 10 (+ professionnel) | guide débutants #5, technique découpe (page CMS) |
| U3 | **Meilleure cocotte en fonte** | 10 (+ émaillée, induction) | guide fonte #22 + recette bourguignon |
| U4 | **Meilleur robot pâtissier** | 10 (+ 2026, qualité prix) | guide pâtisserie #26 |
| U5 | Meilleur mixeur plongeant / grille-pain (« pour baguette » !) / set de couteaux / blender | 4-10 | guides débutants |

**Format exact du template :** critères qui comptent → `::table` comparatif (modèle/matière/usage/prix) → par profil → entretien → FAQ inox vs antiadhésif. Liens affiliés Amazon + disclosure au premier lien. Recherche produits réelle requise (tests/lire les avis) — pas de comparatif inventé.

## 3. Template 1 — Listicle pays apéro : compléter la famille (format n°1 du site)

Tous validés (7-10 suggestions, variantes boisson/alcool/facile/froid) :

| # | Pays | Autocomplete | Synergie recettes live |
|---|---|---|---|
| L1 | **Liban** | 9 (boisson, alcool) | houmous ✓, falafel à venir (H4) |
| L2 | **Antilles** | 10 (froid, facile) | accras? (à vérifier recettes) |
| L3 | **Tunisie** | 7 (boisson, alcool) | harissa H2, silo africain |
| L4 | **Inde** | 10 (facile, alcool) | tikka ✓, samosas ✓, articles #35/#31 |
| L5 | **Japon** | 10 (maison, boisson) | gyoza ✓ |
| L6 | **Vietnam** | 8 (cocktail litchi) | pad thaï ✓, rouleaux ✓ |
| L7 | Turc / Grec | 10 / 10 (grec = bruit mots fléchés) | — |

**Et le push des 3 existants** (marocain pos 10.6, belge 8.6, portugais 11) : ajouter la ligne « côté histoire » par bouchée (levier de différenciation du template) + vérifier ItemList schema + lier vers apéro dinatoire… c'est ce maillage qui avait fait passer marocain de 30.5 → 12.8 en octobre.

## 4. Template 2 — Ingrédients : les prochains (même série que les 10 faits)

| # | Ingrédient | Autocomplete | Pairing live |
|---|---|---|---|
| I1 | **Gingembre** | 10 (utilisation, poudre) | chaï ✓, pad thaï ✓, marinades ✓ |
| I2 | **Safran** | 10 (utilisation, filaments) | moules ✓ (paella non live) |
| I3 | **Ras el hanout** | 10 (composition !) | silo africain, garam masala #27 (sibling) |
| I4 | **Vanille** | 9 | desserts ✓ |
| I5 | **Sumac** | 10 (origine, leclerc) | falafel/houmous ✓ |
| I6 | **Miso** | 6 (c'est quoi, recette) | silo asiatique ✓ |
| I7 | Tahin / citron / cannelle / paprika | 2-10 (cannelle et paprika fins) | tahin → houmous ✓ |

## 5. Template 8 — Saisonner : fenêtres de publication (6-8 semaines AVANT)

| # | Sujet | Autocomplete | Événement | Fenêtre de publication |
|---|---|---|---|---|
| S1 | **Menu de Noël** (+ idées) | 10 (2026, traiteur) | 25 déc | **maintenant → mi-déc** |
| S2 | **Menu Ramadan 30 jours** | 10 (pdf, tunisie) | ~6 fév 2027 | mi-déc → mi-janv |
| S3 | **Recette galette des rois** | 10 (frangipane, facile) | 6 janv | fin nov → mi-déc |
| S4 | **Menu nouvel an chinois** | 10 (2026) | ~6 fév 2027 | mi-déc → mi-janv |
| — | Pâte à crêpes Chandeleur | 1 seul — fin | 2 févr | faible en FR exact |

**S1-S4 = le format « listicle/menu » adapté au saisonnier** : les recettes du silo existent (chebakia ✓, bissap ✓, desserts africains ✓ pour le Ramadan ; biryani/bourguignon pour Noël) — c'est un travail d'assemblage + maillage, pas de recherche.

## 5bis. Hiver Europe — France, Italie, Norvège, Finlande, Suisse

Demande validée autocomplete par pays (03/11). **Les fenêtres sont ouvertes** : marchés de Noël et Saint-Nicolas (6 déc) exigent publication mi-nov ; Noël fin nov.

### FRANCE

| # | Sujet | Autocomplete | Template | Fenêtre |
|---|---|---|---|---|
| W1 | **Vin chaud : la recette des marchés de Noël** (grand-mère, traditionnelle) | 10 | 8 + 7 | **maintenant** (pics nov-déc) |
| W2 | **Bredele : les biscuits de Noël alsaciens** (10 bredeles, traditionnelle/alsacienne) | 10 | 1 × 8 listicle | **mi-nov** (avant St-Nicolas 6 déc + marchés) |
| W3 | **Les 13 desserts de Provence** (tradition, liste) | 10 | 1 × 8 listicle + 9 (légende des 13 = Jésus + 12 apôtres) | **maintenant** |
| W4 | **Histoire de la bûche de Noël** (« la véritable histoire ») | 4 | 9 (T4 : bûche du solstice → pâtisserie 19e → bûche glacée) | **maintenant** |

### ITALIE

| # | Sujet | Autocomplete | Template | Fenêtre |
|---|---|---|---|---|
| W5 | **Panettone : l'histoire (et comment choisir)** | recette 10 + histoire 3 (origine) | 9 T4 parfait : légende Ughetto vs archives Motta 1919 (tradition industrielle plus jeune qu'on croit) | **maintenant** |
| W6 | **Menu de Noël italien** (réveillon, repas) | 6 | 8 menu-guide (format réplicable par pays) | **maintenant** |
| — | Struffoli (10 : recette, naples) | — | → vague recettes (intention « recette » = silo recettes) | à créer en recette |

### NORVÈGE / FINLANDE (regroupées : la demande FR les fusionne)

| # | Sujet | Autocomplete | Template | Fenêtre |
|---|---|---|---|---|
| W7 | **Gløgg : le vin chaud scandinave** | glögg recette 6 (**finlandais**, suédois) + vin chaud norvégien 4 (scandinave) | 8 + 7 | **mi-nov** |
| W8 | **Noël en Scandinavie : traditions et pâtisseries** (pepperkaker, piparkakut, julekake, risgrøt et l'amande cachée, joulutahti) | 1-2 chacun mais famille combinée « noël scandinave/norvégien/finlandais traditions » | 1 × 8 listicle + 9 folklore (l'amande : celui qui la trouve…) | **mi-nov** |
| — | Lohikeitto (soupe de saumon finlandaise, 7 : recette/crème) | — | → vague recettes (intention « recette ») | à créer en recette |

### SUISSE

| # | Sujet | Autocomplete | Template | Fenêtre |
|---|---|---|---|---|
| W9 | **Raclette ou fondue : le duel suisse** (raclette 10 + fondue 10 + « raclette suisse ou française » = requête comparatif !) | 10 + 10 | 7 comparatif/technique + affiliation (raclette machine, caquelon = ustensiles) | **maintenant** |
| — | Fondue/raclette en recettes complètes | intention « recette traditionnelle/vacherin » | → vague recettes | à créer en recette (cuisine européenne) |

**Notes d'exécution hiver :** les listicles W2/W3/W8 exigent des images par item (médiathèque/Pexels) — le seul blocage est la production média. W1/W7 portent la méthode dans le corps de l'article (boissons simples) sans recette dédiée. W9 est le seul sujet hiver à angle affiliation direct.

### Fenêtres récapitulatives hiver

```
3-13 nov    : W1 vin chaud · W3 13 desserts · W4 bûche · W5 panettone · W6 menu italien · W9 raclette-fondue · S1 menu Noël
15-25 nov   : W2 bredele (avant St-Nicolas 6 déc) · W7 gløgg · W8 Noël scandinave · S2 Ramadan · S4 Nouvel an chinois
début déc   : S3 galette des rois (pour le 6 janv)
```

---

## 6. Ordonnancement proposé (après gate nuxtseo à la reprise du provider)

**Règle de tri : fenêtre saisonnière qui expire > demande prouvée > effort.** Les sujets hiver W1-W9 et S1-S4 sautent devant quand leur fenêtre est ouverte.

| Rang | Sujet | Template | Effort | Pourquoi |
|---|---|---|---|---|
| 1 | **W1 Vin chaud** + S1 Menu Noël | 8 | rédaction/assemblage | fenêtre = maintenant, pics nov-déc |
| 2 | **W3 13 desserts de Provence** | 1×8 | listicle (13 items + images) | 10 suggestions « tradition/liste », légende intégrée |
| 3 | **W5 Panettone histoire** | 9 | rédaction 6-9k | T4 parfait (Motta 1919), recette 10 + histoire 3 |
| 4 | **W9 Raclette vs fondue** | 7+4 | comparatif | 2×10 suggestions + requête comparatif ; affiliation |
| 5 | H1 Couscous (histoire) | 9 | rédaction 6-10k | 24 histoires prêtes, silo africain, UNESCO, plat préféré des Français, 5 suggestions |
| 6 | **W2 Bredele** | 1×8 | listicle (10 items + images) | 10 suggestions ; publier avant St-Nicolas 6 déc |
| 7 | **W4 Bûche de Noël histoire** | 9 | rédaction | 4 suggestions dont « la véritable histoire » |
| 8 | **W6 Menu de Noël italien** | 8 | assemblage | 6 suggestions, format menu réplicable |
| 9 | H3 Bœuf bourguignon (histoire) | 9 | rédaction | recette live ✓, 9 suggestions, hook parfait (Mme Saint-Ange) |
| 10 | **W7 Gløgg + W8 Noël scandinave** | 8/1 | rédaction + images | Norvège/Finlande couvertes ensemble ; mi-nov |
| 11 | U1 Air fryer (comparatif) | 4 | recherche produits | monetization #1, requêtes GSC via fricadelle |
| 12 | H2 Harissa (histoire) | 9 | rédaction | UNESCO 2022, Tunisie, silo africain |
| 13 | I1 Gingembre | 2 | rédaction | 10 suggestions, pairing maximal |
| 14 | L1 Apéritif libanais | 1 | rédaction + photos | le format n°1 du site, houmous live |
| 15 | H4 Falafel | 9 | rédaction | 10 suggestions, houmous live |
| 16 | S2/S4 Menus Ramadan / Nouvel an chinois | 8 | assemblage | publier mi-déc pour février |
| 17 | S3 Galette des rois | 8 | article/recette | début déc pour le 6 janv |
| 18 | U2-U4 Couteau/cocotte/robot | 4 | recherche produits | monetization |
| 19 | H5 Tajine / H6 Croissant / H7 Pizza | 9 | rédaction | 4-10 suggestions |
| 20 | L2-L6 Antilles/Tunisie/Inde/Japon/Vietnam | 1 | rédaction + photos | 7-10 suggestions |
| 21 | I3 Ras el hanout / I2 Safran | 2 | rédaction | 10/10 suggestions |
| 22 | A1-A7 push des listicles existants (histoire par bouchée) | 1 | enrichissement | pos 8-11 → page 1 |
| 23 | I4-I7 Vanille/sumac/miso/tahin | 2 | rédaction | selon gate |
| 24 | Recettes hiver du silo : struffoli, lohikeitto, fondue, raclette | recettes | jdc-recipe-creator | intention « recette » confirmée (10/10/7) → silo recettes, pas articles |

## 7. Règles d'exécution

1. **Gate avant chaque article** : volume/difficulté nuxtseo (provider à réactiver) — un sujet sans volume confirmé reste en file.
2. **Histoire d'abord** (template 9) : c'est le format le plus différenciant ET la recherche est déjà faite (24 récits sourcés dans le framework).
3. **Saisonnier selon le calendrier** : 6-8 semaines avant l'événement, refresh annuel ensuite.
4. **Comparatifs = produits réels testés/avis lus** — jamais de tableau inventé ; disclosure affilié au premier lien.
5. **Chaque article** : query front dans titre + intro, FAQ PAA, 1 lien up (hub) + 1-2 sideways (recettes/articles), tables quand ça aide.

---

## Annexe — clusters GSC 12 mois (demande réelle déjà visible)

| Famille | Imp 12m | Requêtes | Best pos | Traitement programme |
|---|---|---|---|---|
| dessert africain | 2792 | 52 | 7.8 (variante nord) | hub live 03/11 ; spokes = H4 falafel, thiakry draft, cornes de gazelle |
| apéritif marocain/belge/portugais | 3240 cumulés | 152 | 8.6-11 | push « côté histoire » par bouchée + ItemList check |
| fricadelle | 712 | 136 | 33 | FAQ cuisson poêle/four/air fryer dans la recette |
| crevettes grises | 408 | 60 | 83.8 | FAQ choisir/cuire dans la recette |
| gaufres salées | 240 | 92 | 74 | FAQ/idées dans la recette (pas d'article — recette existante) |
| pâtes italiennes types | 112 | 56 | 70 | refresh de l'article #33 + ItemList |
| boissons africaines | 64 | 20 | 38.5 | refresh #18 + liens bissap/hub |
| bouchées à la reine | 16 | 16 | 86 | FAQ garniture dans la recette |
| conservation | — | — | 90/36 | restructure (audit §2.4), inchangée |
