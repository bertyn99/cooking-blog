# Article #8 — Brouillon v2 (Blitz apéritif marocain, J1 → J5)

**Cible :** `/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete`
**Statut :** J1→J5 poussés en prod le 14/11. On-page S1 complète.
**Plan de référence :** `docs/seo-strategy/blitz-aperitif-marocain-2026-11.md`

---

## 1. Métadonnées (J1)

| Champ | Actuel | Proposé | Longueur |
|---|---|---|---|
| `title` | Apéritif marocain : 10 recettes de bouchées faciles | **Apéritif marocain : 10 bouchées faciles pour l'apéro** | 52 c |
| `excerpt` / meta | …10 recettes de bouchées savoureuses — briouates, **msemen**, kefta… | **Apéritif marocain : briouates, kefta, zaalouk, pastilla… 10 bouchées faciles avec les quantités par personne pour un apéro réussi.** | 130 c |
| `coverAltText` | `null` | **Table d'apéritif marocain : brochettes grillées, petites salades, théière et lanterne sur une nappe rayée** | 105 c |
| `coverDescription` | `null` | **Apéritif marocain servi à table : brochettes grillées au centre, salades en petites assiettes, théière et lanterne sur une nappe rayée rouge et blanche.** | 152 c |

**Pourquoi ces changements**
- `recettes` disparaît du title : la page ne contient aucune recette complète. La promesse devient vraie (« bouchées »).
- `apéro` entre dans le title : c'est la variante la plus tapée (52 impressions, pos 9,4) et elle n'y figurait pas.
- `msemen` sort de l'excerpt : présent 7× dans le head/JSON-LD, **0× dans le corps**. Promesse non tenue = clic perdu.
- Les quantités entrent dans l'excerpt : c'est le seul angle qui différencie la page des pages recette isolées du SERP.
- `coverAltText` a été rédigé **d'après l'image réelle** (vérifiée : brochettes au centre, petites assiettes, théière, lanterne, nappe rayée) — pas d'alt inventé.

---

## 2. Blocs média — RÉSOLU (photos réelles, 14/11)

Aucune image de zaalouk ni de fekkas n'existait dans la médiathèque (246 fichiers parcourus). La génération était indisponible le 14/11 : `generate-media` (prod) renvoie `Cannot set properties of undefined (setting '#options')` sur tous les modèles, et `experimental_image_generate` échoue faute de crédits OpenRouter. Décision humaine : **photos réelles Pexels**, avec un alt qui décrit ce que montre l'image.

| Image | Emplacement | Fichier uploadé | Source |
|---|---|---|---|
| Zaalouk | item 7 (seule bouchée sans image) | `uploads/66405b3b-8d65-4779-9f5f-3a5df58797c5-zaalouk-aperitif-marocain.webp` | Pexels 15108368 — aubergine-tomate concassée, oignon frit, pain marocain, zellige |
| Fekkas à l'ail | item 5 (remplace la chorba) | `uploads/6146fa9c-1b6f-4108-b96e-79481bdd15d1-fekkas-ail-sesame-aperitif-marocain.webp` | Pexels 755721 — petits sablés ronds dorés au sésame |

Candidats écartés : les têtes de classement du re-rank vision pour « zaalouk » (5191817, 19813646, 36879175) sont des purées blanches (houmous, baba ganoush) — les étiqueter « zaalouk » aurait été faux. Les 11 images de l'article répondent 200 en prod (vérifié le 14/11).

L'article contient déjà deux images générées (`pastilla-poulet-generee`, `batbout-farci-genere`) : la cohérence visuelle est acquise.

**Dette ouverte :** `generate-media` reste cassé en prod — à traiter hors chemin critique (binding `CMS_AI_GATEWAY_ID` sur le worker déployé, puis fallback Flux).

---

## 3. Contenu complet proposé

> Remplacer intégralement le champ `content`. Les 10 items gardent leur numérotation ; la **chorba laisse sa place aux fekkas à l'ail** (le doublon avec la harira disparaît, et le plat que le SERP place en 3, 4 et 13 entre enfin dans la page).

```markdown
Mon premier apéro marocain ne s'est pas passé à Marrakech mais dans une cuisine lyonnaise, chez une amie dont la mère pliait des briouates pendant que le thé à la menthe montait. Trois choses m'ont frappé ce soir-là : la mayonnaise est hors sujet, le cumin est roi, et on ne s'arrête jamais à une seule bouchée.

Voici dix bouchées marocaines à servir à l'apéritif, avec les quantités par personne et, quand elle existe, la recette de la maison.

## Combien de bouchées par personne pour un apéritif marocain ?

Comptez **8 à 10 bouchées par personne** pour un apéritif simple avant le repas, **12 à 15** si l'apéritif remplace le dîner. Prévoyez **3 à 4 variétés**, pas plus : les bouchées marocaines sont riches — friture, huile d'olive, pain — et trois bouchées de quatre sortes valent mieux que quinze de la même. Pour dix personnes, partez sur 90 à 100 bouchées au total.

## 1. Les briouates aux légumes

![Briouates aux légumes dorées et croustillantes, apéritif marocain](/uploads/c03b7dd5-84f8-4d5e-a7bb-95373dd91e54-pexels-37382223.webp)

Les briouates sont les cousines marocaines des calzones : des triangles de feuille de brick garnis puis frits. Les végétariennes se garnissent de carottes, petits pois et courgettes confits aux épices. Leur origine raconte la même histoire que la pastilla : les réfugiés andalous ont apporté au Maroc leurs pâtisseries salées et sucrées au XVe siècle — la brick et la warqa sont de la même famille.

**Pour 6 personnes :** 20 briouates, soit 3 par personne. 30 minutes de montage, 2 minutes de friture par fournée.

**Trois gestes :** faites compoter carottes et courgettes 20 minutes à couvert avec cumin et paprika · garnissez des demi-feuilles de brick, pliez en triangle, collez au blanc d'œuf · friez 2 minutes à 180 °C et égouttez sur une grille, jamais sur du papier.

## 2. Le kefta de bœuf aux herbes

![Kefta de bœuf aux herbes grillé au barbecue, apéritif marocain](/uploads/4d1aabeb-db66-42c2-a84e-180712f1350e-pexels-36890239.webp)

Le kefta, c'est la viande hachée marocaine — bœuf ou agneau pilé au couteau avec persil, coriandre, cumin et paprika. En bouchées : des mini-brochettes ou des boulettes servies tièdes. Le secret tient au hachage : au couteau ou au moule à kefta, jamais au robot, sinon la texture devient pâteuse.

**Pour 6 personnes :** 500 g de viande hachée, une vingtaine de boulettes ou 12 mini-brochettes.

**Trois gestes :** mélangez la viande aux herbes hachées et aux épices, 10 minutes à la main · formez des boulettes de la taille d'une noix, ou enroulez la viande autour d'une pique · grillez 3 minutes par face, elles restent rosées dedans.

## 3. La salade de poivrons grillés à la marocaine

![Salade de poivrons grillés à la marocaine, servis en mezze](/uploads/f0fc77b6-b3c7-496f-a747-eb116914a421-pexels-39828001.webp)

Les Marocains cuisent leurs salades — c'est leur signature. Poivrons grillés, pelés, émincés finement, assaisonnés à l'huile d'olive, ail confit et un trait de citron confit. Servie tiède ou froide avec du pain, c'est l'entrée d'un repas marocain traditionnel qui devient bouchée quand on la tartine.

**Pour 6 personnes :** 4 poivrons (500 g), un bol, 30 minutes sur la flamme.

**Trois gestes :** noircissez les poivrons entiers, puis enfermez-les 10 minutes dans un sac — la peau se détache seule · émincez-les à la main, jamais au mixeur · assaisonnez tiède : huile d'olive, ail confit, cumin, citron confit.

## 4. La pastilla au poulet

![Pastilla au poulet dorée, treillis de sucre glace et cannelle, amandes grillées](/uploads/5d876e22-d5c7-4ec1-afde-6311f19dfb73-pastilla-poulet-generee.webp)

La star des grandes occasions : une feuille de warqa croustillante, une farce de poulet à l'oignon confit, une couche d'amandes grillées broyées, et cette signature sucré-salé à la cannelle. En format apéro, on la découpe en carrés ou en tranches fines. L'origine raconte l'Andalousie : une recette de pie sucré-salé du XIIIe siècle déjà, emmenée à Fès par les réfugiés andalous. La recette est sur le journal — [la pastilla au poulet](/recette/pastilla) — et sa cousine roulée, la [m'hanncha](/recette/m-hanncha), se découpe aussi en tronçons pour l'apéritif.

**Pour 6 personnes :** une pastilla de 28 cm coupée en 12 carrés, soit 2 par personne.

## 5. Les fekkas à l'ail

![Fekkas à l'ail, petits sablés salés marocains au sésame, servis à l'apéritif](/uploads/6146fa9c-1b6f-4108-b96e-79481bdd15d1-fekkas-ail-sesame-aperitif-marocain.webp)

Les fekkas sont les sablés marocains, et la version à l'ail est la seule bouchée de cette liste qui se garde. Des petits sablés salés, à la fois secs et fondants en bouche, où l'ail et le cumin prennent la place du sucre. On les sert tièdes ou froids, jamais brûlants, et on en trouve en sachet chez les pâtissiers marocains, à côté des amandes grillées et des ghribas.

**Pour 6 personnes :** une quarantaine de sablés, à sortir d'une boîte — ils tiennent cinq jours.

**Trois gestes :** sablez farine, huile d'olive et ail écrasé du bout des doigts, sans pétrir · formez des palets de 3 cm, dorez à l'œuf, parsemez de sésame et de cumin · 20 minutes à 170 °C, ils durcissent en refroidissant.

## 6. Les brochettes de crevettes marinées

![Brochettes de crevettes marinées grillées, apéritif marocain](/uploads/d549d702-b6bc-4d68-9425-0411c72cbe74-pexels-8250728.webp)

Marinées à l'huile d'olive, paprika, ail et persil, grillées deux minutes de chaque côté. Notre recette de [brochettes de fruits de mer marinés](/recette/brochettes-de-fruits-de-mer-marines) reprend le même principe avec une marinade méditerranéenne — la version marocaine y ajoute le cumin et le citron beldi.

**Pour 6 personnes :** 18 grosses crevettes, 6 brochettes de trois, 2 minutes par face.

## 7. Le zaalouk d'aubergines

![Zaalouk d'aubergines et de tomates, huile d'olive et cumin, servi avec du pain marocain](/uploads/66405b3b-8d65-4779-9f5f-3a5df58797c5-zaalouk-aperitif-marocain.webp)

Le zaalouk, c'est la salade cuite marocaine par excellence : aubergines fondantes, tomates confites, ail et cumin, assaisonnées généreusement d'huile d'olive. Contrairement à la salade européenne, on cuit les légumes longtemps jusqu'à obtenir une compote généreuse. Se tartine sur du pain — le pain fait partie du repas, pas un accessoire.

**Pour 6 personnes :** 2 aubergines (600 g), un bol, 40 minutes de cuisson.

**Trois gestes :** faites revenir l'ail et les tomates 10 minutes, ajoutez les aubergines en cubes · couvrez et laissez compoter 25 minutes, jusqu'à ce qu'elles s'écrasent à la cuillère · écrasez à la fourchette, pas au mixeur, et arrosez d'huile d'olive hors du feu.

## 8. Le tajine de légumes en mini-portions

![Tajine de légumes coloré servi dans un mini-plat traditionnel](/uploads/a631ab2f-7016-414c-a333-1cf2b603bf8f-pexels-2291596.webp)

Le tajine de légumes déconstruit en bouchées : légumes confits au ras-el-hanout, servis dans des mini-cocottes ou sur des cuillères apéritives. La cuisson à l'étouffée dans le plat en terre cuite garde les légumes fondants — [la méthode complète](/techniques-culinaires/methodes-de-cuisson) est sur le blog.

**Pour 6 personnes :** 1 kg de légumes, 24 cuillères ou 12 mini-cocottes.

**Trois gestes :** taillez carottes, courgettes et navets en morceaux réguliers · faites-les confire 30 minutes à feu doux avec ras-el-hanout, cumin et un fond d'eau · servez tiède, une cuillère par bouchée, avec un peu de sauce.

## 9. Le batbout farci

![Batbout farci au thon et aux légumes, ouverts sur la farce, apéritif marocain](/uploads/06e78dc3-c837-4a43-ba91-90dc3839c175-batbout-farci-genere.webp)

Le batbout, c'est le petit pain moelleux marocain cuit à la poêle — la poche parfaite pour des bouchées farcies : thon, crudités, kefta émiettée. Plus doux qu'un pita, il tient la garniture sans s'effriter. On le trouve dans les boulangeries marocaines, mais la version maison le surclasse.

**Pour 6 personnes :** 10 mini-batbouts coupés en deux, soit 20 bouchées.

**Trois gestes :** pétris farine, semoule fine, levure et eau tiède, laissez lever 1 heure · étalez à 5 mm et faites cuire à sec dans une poêle chaude, 3 minutes par face · ouvrez encore tiède, sinon la poche se déchire.

## 10. La harira en verrines

![Harira marocaine aux lentilles et pois chiches, en bol de terre cuite](/uploads/94bba89e-e97f-476e-8393-336c0b198807-pexels-29850843.webp)

La soupe du ftour par excellence : tomates, lentilles, pois chiches, vermicelles, coriandre et céleri. En verrines pour l'apéritif, c'est la bouchée-qui-réchauffe — parfaite quand l'apéro glisse vers le dîner, comme c'est souvent le cas dans une soirée marocaine qui ne finit jamais tôt.

**Pour 6 personnes :** 1,5 litre de harira, 12 verrines.

**Trois gestes :** faites tomber oignon, céleri et coriandre dans l'huile, ajoutez tomates concassées et épices · versez bouillon, lentilles et pois chiches, 40 minutes à petits frémissements · liez à la farine délayée en fin de cuisson, vermicelles 5 minutes avant de servir.

## Que boire avec un apéritif marocain ?

Le thé à la menthe, d'abord — et son histoire est plus récente qu'on croit : le thé vert arrive au Maroc au milieu du XIXe siècle par les commerçants européens, et les Marocains en font leur boisson nationale en y ajoutant la menthe nanah et beaucoup de sucre. Le sucre, lui, vient des routes de la canne — [la même histoire que la pâtisserie du ftour](/blog/inspiration-culinaire/10-desserts-delicieux-de-la-cuisine-d-afrique-du-nord). Le service a son cérémonial : on verse de haut, et l'on sert trois verres — « le premier est amer comme la vie, le deuxième sucré comme l'amour, le troisième doux comme la mort ».

Ensuite le vin, si la table en prend. Le Maroc produit des blancs secs et des rosés dans les vignobles de Meknès et de Benslimane, et un blanc vif tient très bien les bouchées frites. Cela reste minoritaire : beaucoup de tables marocaines ne servent que le thé, et c'est très bien ainsi.

Sans alcool, la citronnade à la fleur d'oranger et le jus d'orange pressé font aussi l'affaire. Le [dossier apéritif](/recette/aperitif) et les [boissons du monde](/recette/boissons-du-monde) donnent les proportions.

![Ghriba marocaines et thé à la menthe](/uploads/ghriba_7bc136a8bc.webp)

## Pour aller plus loin : la pâtisserie marocaine

Si l'apéritif marocain glisse vers le sucré (et il glisse toujours), les pâtisseries de la maison vous attendent : [chebakia au miel et sésame](/recette/chebakia), [cornes de gazelle aux amandes](/recette/corne-de-gazelle), [m'hanncha en spirale](/recette/m-hanncha) et [zlabia maison](/recette/zlabia). Le tout se partage autour du thé — les [desserts d'Afrique du Nord en ont dix autres](/blog/inspiration-culinaire/10-desserts-delicieux-de-la-cuisine-d-afrique-du-nord).

::recipe-list{source="slugs" slugs="pastilla,brochettes-de-fruits-de-mer-marines,m-hanncha" limit="3"}
#title
Les recettes maison qui vont avec
::

::faq{items='[{"question":"Quelles bouchées préparer pour un apéritif marocain ?","answer":"Un trio fonctionne toujours : une frite (briouates), une salade cuite tartinée (zaalouk) et une brochette grillée (kefta ou crevettes). Ajoutez des olives marocaines et du pain."},{"question":"Quelles épices pour un apéritif marocain ?","answer":"La base : cumin, paprika, curcuma, gingembre, ras-el-hanout, safran et coriandre fraîche. Le cumin domine — il est dans le kefta, le zaalouk et les fekkas."},{"question":"Peut-on préparer un apéritif marocain la veille ?","answer":"Les trois quarts, oui. Zaalouk, salade de poivrons, harira et marinade de crevettes tiennent 24 h au frais, et les fekkas se gardent cinq jours en boîte. Le montage se fait au dernier moment : briouates frites à la minute, batbout ouvert tiède, kefta grillé juste avant de servir."},{"question":"Peut-on congeler les briouates ?","answer":"Oui, et crues. On les monte, on les range à plat, et on les frit directement à la sortie du congélateur, sans décongélation — deux minutes de plus suffisent."},{"question":"Peut-on servir un apéritif marocain sans alcool ?","answer":"C’est même la norme : thé à la menthe, citronnade à la fleur d’oranger, jus d’orange pressé. L’alcool reste minoritaire à table au Maroc, et un apéritif sans vin ne perd rien."}]'}
#title
L'apéritif marocain en questions
::
```

---

## 4. Ce qui change, jour par jour

| Jour | Changement | Vérifié |
|---|---|---|
| **J1** | Title 52 c., excerpt = meta 130 c., `coverAltText` + `coverDescription` remplis d'après l'image réelle, slug inchangé | prod, 14/11 |
| **J2** | Quantités sur les 10 bouchées · chorba → **fekkas à l'ail** · 2 H2 neufs · zaalouk illustré (Pexels 15108368) · fekkas illustré (Pexels 755721) | prod, 14/11 |
| **J3** | Ancre pastilla corrigée · m'hanncha liée · 7 bouchées sans page reçoivent 3 gestes · `::recipe-list` **retiré** (PROSE_TAGS) | 9 ancres recette testées HTTP 200 |
| **J4** | FAQ prose → `::faq` (5 items, accordéon) · apostrophes typographiques | prod, 14/11 |
| **J5** | Pression interne : #9 et #16 + 4 recettes marocaines (voir §5) | prod, 14/11 |

**Contrôles (prod, 14/11)**
- [x] `msemen` : 0 occurrence dans le corps visible (reste éventuellement dans le payload Nuxt / cache ISR — pas dans le HTML rendu).
- [x] `::faq` : quote fermante présente, 5 questions rendues, H2 « L'apéritif marocain en questions ».
- [x] `::recipe-list` retiré : le tag n'est pas dans `PROSE_TAGS` des articles, il n'aurait jamais rendu.
- [x] Placeholders remplacés : zaalouk `66405b3b-…`, fekkas `6146fa9c-…`.
- [x] 11 images du corps, toutes 200.
- [x] Meta description alignée via `upsert-seo` (l'`excerpt` seul ne change pas le `<meta name="description">`).

---

## 5. Annexes J5 — autres pages à retoucher après le push

### Article #9 — desserts d'Afrique du Nord
> Mentionne « marocain » 3×, ne lie pas #8. Ajouter en fin d'intro :

`L'apéro, avant les douceurs : les [dix bouchées marocaines](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete) tiennent la table pendant qu'on prépare le plateau.`

### Article #16 — apéritif belge
> Zéro mention du Maroc. Ajouter dans la phrase de clôture « pour continuer le voyage », qui ne cite aujourd'hui que le hub :

`… et si l'envie change de continent, les [bouchées marocaines](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete) prennent le relais.`

### 4 recettes marocaines — 1 lien retour chacune, dans l'`intro`
| Recette | Phrase proposée |
|---|---|
| chebakia | `À servir avec le thé, après un [apéritif marocain](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete) qui a déjà fait le tour de la table.` |
| corne-de-gazelle | `Le plateau sucré vient toujours après l'apéro — [dix bouchées salées](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete) pour ouvrir la table.` |
| m-hanncha | `Si vous cherchez le salé d'avant, l'[apéritif marocain](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete) en tient dix.` |
| zlabia | `La friture sucrée du Ramadan a son pendant salé : [l'apéritif marocain](/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-marocain-pour-l-ete).` |

**Une seule ancre par page, jamais deux** — au-delà, ça se lit comme du maillage acheté.
