# Contenu Décembre–Janvier — gates du 20/11/2026

Deux recettes saisonnières créées en draft après gate + SERP. Le troisième candidat
(`menu noel`) a été **refusé** au SERP — même logique que `amuse-bouche` / `verrine`.

| Candidat | Volume | Diff | Pic saisonnier | Verdict |
|---|---|---|---|---|
| `galette frangipane` | **14 800** | 0 | **165 000 janv** / 22 200 déc | ✅ recette #108 |
| `recette harira` | 5 400 | 0 | **27 100 fév** (Ramadan 18 fév) | ✅ recette #109 |
| `menu de noel` | 9 900 | 0 | — | ❌ page 1 = 100 % éditorial (Marmiton, magazines) — front perdu, le contenu existant (bredele, bûche, vin chaud) couvre déjà `recette noel` |

## 1. Galette des rois frangipane — draft 108

`id 108`, slug `galette-des-rois-frangipane`, catégorie Dessert (1), 8 parts, 45 min prep +
35 min cuisson + repos dorure, medium.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=galette-des-rois-frangipane

- Gate : `galette frangipane` 14 800/mo (nuxtseo 2250, diff 0). SERP : blogs perso + marques
  (Alsa, Herta, Michalak), **pas de Marmiton en page 1**. AI overview + PAA.
- Contract d'intention couvert : vraie frangipane (crème d'amande + crème pâtissière),
  pâte pur beurre, dorure double passage + repos (brillance sans colorant), fève à mi-rayon
  (pas au centre), chiquetage, conservation 2 j / réchauffage 150 °C, montée crue la veille,
  ~700 kcal/part (indicatif).
- Angle : l'étymologie Frangipani (parfumeur, XVIIe) présentée comme belle histoire discutée.
- Images : Pexels — cover `39070793` (petite galette individuelle, sujet correct, plaquette
  orange médiocre — **l'humain peut l'échanger dans l'admin**) + corps `10307513`
  (dorure au pinceau, dans l'intro).
- Glossaire : réutilisé 237 pâte feuilletée, 1 amandes en poudre, 5 beurre, 109/108 sucres,
  80 œufs, 65 jaunes, 69 lait, 38 farine T45, 278 vanille, 300 crème, 109… Stubs créés :
  316 Fève à galette, 317 Rhum ambré, 318 Papier cuisson, 319 Pinceau, 320 Cercle à pâtisserie.
- Liens internes : bredele #51, bûche #50, page desserts-du-monde.
- SEO id 528 · title 55 c · meta 157 c (⚠️ 2 c au-dessus de la cible 140-155, à resserrer à la
  passe 2 si on y revient) · keywords propre.

**Fenêtre de publication : 15–20 décembre** (Épiphanie 6 janv ; la demande monte mi-déc,
pic janvier). Ne pas publier pendant la fenêtre muette 24–31 déc.

## 2. Harira marocaine — draft 109

`id 109`, slug `recette-harira-marocaine`, catégorie Plat (4), 6 portions, 20 min prep +
60 min cuisson, easy.
Preview : https://journalducuistot.fr/preview?type=recipe&slug=recette-harira-marocaine

- Gate : `recette harira` 5 400/mo (nuxtseo 2250, diff 0), variantes `harira marocaine` 2 400,
  `recette harira facile` 390. Pic 27 100 en février (Ramadan 18 fév 2027), 12 100 en mars.
  SERP : blogs marocains + YouTube, pas de Marmiton/CuisineAZ.
- Angle : la harira comme ouverture du jeûne (ftour : dattes + lait + harira), la tadouira
  (liaison farine-eau sans roux), l'ordre des étapes — vermicelles 5 min à la fin sinon pâte
  (erreur vécue assumée), préparation à l'avance jusqu'à la tadouira, congélation sans
  vermicelles.
- Images : Pexels `28902900` (bol de soupe tomate-lentilles à la coriandre, sujet honnête).
- Glossaire : réutilisé 11 bœuf, 82 oignon, 58 huile d'olive, 111 tomates, 208 concentré,
  226 pois chiches, 38 farine, 157 curcuma, 142 gingembre, 97 poivre, 88 persil, 156
  coriandre, 25 citron. Stubs créés : 321 Céleri en branches, 322 Lentilles vertes,
  323 Vermicelles de blé fins, 324 Dattes.
- ⚠️ **Limite D1 touchée** (18 lignes × 7 bind params > 100 — famille YGG-184) : la création
  avec 18 ingrédients échoue. Contournement : 15 lignes via `update-recipe` (sel, citron et
  dattes vivent dans les étapes, pas dans la liste). **Règle à retenir : max ~13 ingrédients
  par appel MCP.**
- Liens internes : chebakia #21, corne de gazelle #2, apéritif marocain #8, recettes-du-monde.
- SEO id 533 · title 44 c · meta 152 c ✓.

**Fenêtre de publication : 2–6 janvier** — six semaines avant le Ramadan (18 fév), la
demande `harira` remonte dès janvier (5 400 en janv 2026).

## Bug generate-media (catalog) — état après enquête

Toujours cassé après le deploy : `binding.gateway(id).run(request)` lève
`Cannot set properties of undefined (setting '#options')` **dans le runtime workerd à la
compat date 2026-09-15** (constaté avec et sans l'objet options — le fix déposé retire
l'objet options, sans effet). Le fallback Flux direct échoue pareil. Pistes : bump sélectif
de la compat date du worker CMS (risque YGG-127, startup validation du workflow), ou passage
par l'API REST AI Gateway avec token. **Non bloquant** : Pexels couvre ; à rouvrir si un
sujet sans stock honnête se présente.

## Ordonnancement déc-jan (proposition)

| Fenêtre | Contenu | Statut |
|---|---|---|
| 28 nov | Article vin chaud #48 (schedulé) | déjà en place |
| 1, 4, 8, 11 déc | Recettes #101–104 (schedulées) | déjà en place |
| 15–20 déc | **Galette #108** | draft — à scheduler |
| 22 déc | Décision libanais → mezzé #53 prêt | draft |
| 24–31 déc | **Fenêtre muette : rien ne sort** | règle blitz |
| 2–6 janv | **Harira #109** | draft — à scheduler |
| mi-janv | (option) gate Nouvel an chinois (6 fév 2027) | à décider |
