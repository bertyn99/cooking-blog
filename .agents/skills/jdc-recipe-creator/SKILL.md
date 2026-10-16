---
name: jdc-recipe-creator
description: |
  Create complete, SEO-optimized French recipes for Journal du Cuistot (journalducuistot.fr)
  in the voice of Bertyn Boulikou — structured recipes with intro, quantified ingredients
  linked to glossary terms, ordered steps, utensils (glossary + affiliate on the term),
  nutrition per portion, cover and FAQ. Covers keyword research (nuxtseo CLI + Search Console
  MCP), Recipe schema completeness, the media loop for cover/images (list-media →
  search-stock-media → import → upload), glossary lookup/stubs, draft creation and in-place
  updates via the jdc-cms MCP.

  Use when: creating a new JDC recipe, improving an existing recipe (intro, quantités PAA,
  nutrition, utensils, glossary links), adding a cover/utensils/nutrition to a bare recipe,
  or researching keywords for a recipe topic.
---

# JDC recipe creator

Create French recipes for [journalducuistot.fr](https://journalducuistot.fr) that rank AND cook well: **Bertyn Boulikou, young passionate cook** — recettes testées, quantités précises, histoires courtes. Une recette qui rank, c'est une recette qui répond aux questions avant qu'elles soient posées : combien par personne, combien de temps, quel vin, comment savoir que c'est cuit.

Non-negotiable: **data first** (keywords + SERP), **quantities everywhere** (le cluster PAA gagne toujours), **drafts only** (never publish via MCP), **voice always**, **glossary first** (ingrédients et ustensiles = fiches, pas des strings libres).

**Toolchain:** `nuxtseo` CLI (site `s_7a49d74f`) + **Search Console MCP** (`sc-domain:journalducuistot.fr`) + **jdc-cms MCP** (`create-recipe`, `update-recipe`, `get-recipe`, `list-recipes`, `list-recipe-categories`, `upsert-seo`, media loop, `list-glossary-terms` / `create-glossary-term` / `update-glossary-term` / `list-glossary-icons`). Protocole CLI : voir le skill `nuxtseo-cli`.

**Voix et anti-slop** : réutiliser les références du skill article — `../jdc-article-writer/references/antislop-fr.md` et `../jdc-article-writer/references/voice-arsenal.md` (les 5 patterns + listes noires s'appliquent aux intros de recettes).

**Glossaire / ustensiles** : contrat, stubs, formes culinaires, `iconKey` et affiliation → `references/glossary-and-utensils.md`.

## Workflow

### 0. Inventaire — ne pas créer un doublon

- `list-recipes` (search sur le plat) — une recette existante sur le même plat = **update** de celle-ci, pas une création.
- `list-recipe-categories` — connaître la `categoryId` avant toute création (jamais uncategorized). Ce n'est **pas** `list-article-categories`.

### 1. Keyword gate — la requête qui vit dans la recette

Obligatoire pour une création **et** pour un update. Extraire d'abord le mot-clé déjà écrit dans la recette (`get-recipe` : début du `title`, `slug`, deux premières phrases de l'`intro`, `seo.keywords`). Pour une création, le candidat est le nom court du plat (1 à 3 mots) plus « recette <plat> ».

Cette formulation exacte doit être confirmée par **Search Console MCP ou le CLI `nuxtseo`** (l'autre si le premier est vide ou un refus). Ne pas garder un mot-clé seulement deviné.

1. **Search Console MCP** (`user-search-console`), propriété `sc-domain:journalducuistot.fr` :
   - `analytics_query`, dimension `query`, filtre sur la requête de la recette (3 derniers mois). Les impressions existantes gagnent : écrire pour ces formulations exactes (accents, pluriels, « combien », « comment », « par personne »).
   - Si GSC n'a pas encore de lignes : `seo_keywords_research` `{ keywords: ["<requête>"], country: "fr", language: "fr", type: "stats" }` (puis `type: "related"` pour les variantes).
2. **`nuxtseo` CLI** — site `s_7a49d74f`, toujours `--json --no-input`. Protocole (codes de sortie, enveloppes, dépenses) : skill `nuxtseo-cli`. Ne pas inventer de flags.
   - Demande déjà retenue, sans dépense research : `nuxtseo search analytics keywords --site s_7a49d74f --search "<requête>" --period 3m --json`.
   - Volume live : `nuxtseo research keywords "<graine 1-3 mots>" --site s_7a49d74f --no-input --location-code 2250 --min-volume 10 --json`. Le défaut `2840` est les États-Unis — toujours `2250` (France, DataForSEO). Une graine de plus de 3 mots est refusée (exit `0`, `keywords: []`) : lire `data.message` avant de conclure « zéro demande ». `data.serpFallback.topResults` = les concurrents. Variantes utiles : « <plat> maison », « <plat> facile », « cuisson <plat> ».
3. Le texte qui entre dans le **début du `title`**, le **`slug`**, les **deux premières phrases de l'`intro`** et **`upsert-seo.keywords`** est une requête renvoyée par l'un de ces appels, ou une variante qu'ils associent (impressions, volume, related). Sinon, changer la copie.

**Livrable avant d'écrire** : requête primaire + l'outil qui l'a confirmée (impressions GSC ou volume nuxtseo) + 3-5 variantes + le cluster PAA (combien par personne, calories, cuisson, conservation) + 2 URLs concurrentes + l'angle (l'histoire du plat, la technique qui change tout).

### 2. SERP — contrat d'intention (top 2)

Extraire des 2 premiers résultats organiques (skip Pinterest/forums) :
- Le **contrat** : ingrédients attendus, temps total, difficulté, matériel, étapes, nutrition — ce que tous couvrent.
- **L'écart** : ce que personne ne couvre = l'histoire du plat, la cause physique d'une étape, l'erreur assumée.

### 3. Rédaction (voice Bertyn)

- **Intro (800–2000 chars, 2-4 paragraphes)** : ouverture concrète (un moment vécu en cuisine — jamais « Vous êtes-vous déjà demandé… », jamais « L'été est là »). Y tisser **les réponses PAA du cluster** : quantités par personne (500 g de moules = 2 kg pour quatre), temps réel, le vin, le test de cuisson. L'intro est la zone SEO principale de la recette — elle rend AU-DESSUS des ingrédients.
- **Steps** : 6-12 étapes, ordre chronologique strict, chaque étape avec son repère physique (« jusqu'à ce que les bords frémissent », « doré, pas bruni »).
  - `create-recipe` MCP : `steps[]` `{ title?, instruction }` — une instruction par étape, **sans** préfixe « 1. ».
  - Le template public lit encore le champ markdown `step` (lignes « 1. … » séparées par `\n`). Après création, `update-recipe` avec `step` si les étapes ne s'affichent pas en preview.
- **Ton** : première personne, ce qui surprend, l'erreur assumée une fois, l'aparté entre parenthèses. Pas de triades, pas d'emoji, pas de « Délicez-vous ».

### 4. Couverture et images (media loop)

Règle **nom complet du plat** (jamais l'ingrédient seul) — détails dans `../jdc-article-writer/references/image-selection-criteria.md` :

1. `list-media` — image existante ?
2. `search-stock-media` (nom complet du plat EN + 1-2 ingrédients, `rerank: true`) → `recommendedId`
3. `import-stock-media` (attribution auto)
4. Génération locale (prompt EN complet : plat + dressage + lumière + no text/hands/logos, 4:3) → compression → `upload-media` (base64)

La **cover** = la photo qui montre le plat fini entier (pas une coupe mystérieuse) — `coverBlobPathname` = la clé de stockage (`uploads/<fichier>`), + `coverAltText` descriptif FR.

### 5. Glossaire — résoudre ingrédients et ustensiles

**Avant** `create-recipe`, pour chaque ligne : `list-glossary-terms` `{ kind: "ingredient" | "ustensile", search }`. Terme existant → `glossaryTermId`. Sinon stub `{ name }` (draft+noindex, dédupliqué) ou `create-glossary-term` si la fiche doit être éditorialisée / affiliée.

Détail (formes vs alias, `note` vs nom, `iconKey`, affiliation sur le terme) : `references/glossary-and-utensils.md`.

Règles courtes :

- Ingrédient : `{ glossaryTermId, qty?, unit?, note? }` — unité dans l'enum, préparation dans `note` (émincé, tamisée), **forme culinaire** (lait d'amande) = fiche enfant `parentId`, pas un alias.
- Ustensile : `{ glossaryTermId, note? }` — taille / option dans `note`. **Jamais `affiliateUrl` sur la ligne.** ASIN ou `partnerUrl` sur la fiche `kind: "ustensile"` (`partnerUrl` gagne). `list-glossary-icons` puis `iconKey` sémantique (`pan`, `pot`…), jamais `i-lucide-…`.
- Kind mismatch = erreur. Réutiliser plutôt que dupliquer.

### 6. Création via `create-recipe` (brouillon)

Les champs, leurs contraintes et pièges — unités / nutrition dans `references/units-and-nutrition.md` :

| Champ | Contrainte | Piège |
|---|---|---|
| `title` | ≤ 60 chars, requête exacte devant | jamais « Recettes de plat … » |
| `intro` | 800–2000 chars | les réponses PAA dedans (voir §3) |
| `slug` | keywords, tirets, sans date/saison | à poser explicitement |
| `ingredients[]` | `{ glossaryTermId, qty?, unit?, note? }` **ou** `{ name, qty?, unit?, note? }` | **unit enum stricte** : `none, g, mg, kg, l, ml, cuillere_soupe, cuillere_cafe, tasse` — pas d'accents. Préférer `list-glossary-terms` puis `glossaryTermId`. Stub `{ name }` = draft+noindex. |
| `steps[]` | `{ title?, instruction }` | 6-12, une instruction par étape, sans « 1. » |
| `step` | markdown numéroté (via `update-recipe`) | ce que le template public affiche aujourd'hui |
| `utensils[]` | `{ glossaryTermId, note? }` **ou** `{ name, note?, iconKey? }` | **pas d'`affiliateUrl`**. Affiliation sur le terme ustensile. |
| `nutrition` | `{ calories, glucides, lipides, proteine, sucre, sodium }` (strings) | **par portion**, unités dans la valeur (« 450 kcal », « 18 g ») |
| `difficulty` | `easy/medium/hard` | cohérent avec le temps et les techniques |
| `time` | minutes totales (int) | = prepTimeMinutes + cookTimeMinutes |
| `servings` | int | cohérent avec les qtés d'ingrédients |
| `coverBlobPathname` | `uploads/<fichier>` | + `coverAltText` + `coverDescription` |
| `categoryId` | après `list-recipe-categories` | pas `list-article-categories` |
| `status` | **toujours draft** | la publication est manuelle (humain) |

`create-recipe` ne publie jamais. `update-recipe` édite en place (live compris) — **ne jamais changer le statut**.

### 7. SEO

`upsert-seo` `{ contentType: 'recipe', contentId, description, keywords }` :
- Description 140–155 chars : requête exacte (celle du gate §1) + quantité PAA + bénéfice
- Keywords : requête primaire confirmée par Search Console ou `nuxtseo` + variantes réelles (pas de junk, pas de requête non vérifiée)

Le **schema Recipe** est auto-généré par le template depuis ces champs — un champ manquant (temps, ingrédients, nutrition) = un trou dans le schema. YGG-82 suit l'ajout author/recipeCuisine au niveau template.

Une fiche glossaire créée pour la recette : `upsert-seo` `{ contentType: 'glossary', contentId }` en **laissant noindex,follow** tant qu'un humain n'éditorialise pas.

### 8. Review — deux passes

**Passe 1 — Correction** : faits (temps, quantités, températures vs sources), français, unités de l'enum, cohérence servings↔ingrédients↔étapes, chaque ligne a un `glossaryTermId` (ou stub volontaire), ustensiles sans `affiliateUrl`, liens internes ≥ 2 (ciblés et vivants — vérifier qu'ils existent ; un terme **published** peut servir de lien `/glossaire/<slug>`), alt de cover présent, meta 140-155. **Rejouer le gate §1 sur le mot-clé réellement écrit** (title, slug, intro, `seo.keywords`) via Search Console MCP ou `nuxtseo` — si la formulation de la recette n'est pas celle confirmée, la corriger avant de livrer.

**Passe 2 — Voix** : checklist anti-slop (10 points, fichier article), verdict court, aparté, cause physique dans une étape, l'empreinte vécue. Relire à voix haute — rien qu'on ne dirait pas à table.

**Render check** sur la previewUrl : 200, intro rendue, ingrédients avec unités (lien glossaire seulement si le terme est published), étapes ordonnées, bloc Ustensiles, tableau nutrition rendu, cover affichée, « Acheter » seulement si la fiche ustensile a un ASIN/`partnerUrl`.

### 9. Reporting

`previewUrl` au humain + changelog des deux passes + **termes glossaire réutilisés vs stubs créés** + la requête primaire et l'outil qui l'a confirmée (Search Console MCP ou `nuxtseo`). **La publication est manuelle.** Après publication : GSC `inspection_inspect` + annotation nuxtseo (voir le workflow complet dans `../jdc-article-writer/SKILL.md` §8).

## Monétisation

L'affiliation vit sur la **fiche glossaire ustensile** (`amazonAsin` ou `partnerUrl`), pas sur la ligne recette. Matériel testé uniquement (cocotte, moule, poêle) — le template recette affiche « Acheter » + disclosure. Jamais sur les ingrédients. Voir `docs/seo-strategy/monetization.md` et `references/glossary-and-utensils.md`.
