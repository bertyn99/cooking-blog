---
name: jdc-recipe-creator
description: |
  Create complete, SEO-optimized French recipes for Journal du Cuistot (journalducuistot.fr)
  in the voice of Bertyn Boulikou — structured recipes with intro, quantified ingredients
  (exact units), ordered steps, utensils (affiliate-ready), nutrition per portion, cover and
  FAQ. Covers keyword research (nuxtseo CLI + Search Console MCP), Recipe schema completeness,
  the media loop for cover/images (list-media → search-stock-media → import → upload), draft
  creation and in-place updates via the jdc-cms MCP.

  Use when: creating a new JDC recipe, improving an existing recipe (intro, quantités PAA,
  nutrition), adding a cover/utensils/nutrition to a bare recipe, or researching keywords
  for a recipe topic.
---

# JDC recipe creator

Create French recipes for [journalducuistot.fr](https://journalducuistot.fr) that rank AND cook well: **Bertyn Boulikou, young passionate cook** — recettes testées, quantités précises, histoires courtes. Une recette qui rank, c'est une recette qui répond aux questions avant qu'elles soient posées : combien par personne, combien de temps, quel vin, comment savoir que c'est cuit.

Non-negotiable: **data first** (keywords + SERP), **quantities everywhere** (le cluster PAA gagne toujours), **drafts only** (never publish via MCP), **voice always**.

**Toolchain:** `nuxtseo` CLI (site `s_7a49d74f`) + **Search Console MCP** (`sc-domain:journalducuistot.fr`) + **jdc-cms MCP** (`create-recipe`, `update-recipe`, `get-recipe`, `list-recipes`, `upsert-seo`, media loop). Protocole CLI : voir le skill `nuxtseo-cli`.

**Voix et anti-slop** : réutiliser les références du skill article — `../jdc-article-writer/references/antislop-fr.md` et `../jdc-article-writer/references/voice-arsenal.md` (les 5 patterns + listes noires s'appliquent aux intros de recettes).

## Workflow

### 0. Inventaire — ne pas créer un doublon

- `list-recipes` (search sur le plat) — une recette existante sur le même plat = **update** de celle-ci, pas une création.
- `list-article-categories` — connaître la categoryId avant toute création (jamais uncategorized).

### 1. Keyword research

1. **`nuxtseo` CLI** : `nuxtseo research keywords --site s_7a49d74f --no-input "recette <plat>" --json` — volumes, variantes (« <plat> maison », « <plat> facile », « cuisson <plat> »). LeSERP fallback (`data.serpFallback.topResults`) = la liste des concurrents.
2. **Search Console MCP** : `analytics_query` filtré PAGE/QUERY — la demande existante vaut de l'or : quantités par personne, temps de cuisson, accompagnement, vin.
3. **Livrable avant d'écrire** : requête primaire + 3-5 variantes + le cluster PAA (combien par personne, calories, cuisson, conservation) + 2 URLs concurrentes + l'angle (l'histoire du plat, la technique qui change tout).

### 2. SERP — contrat d'intention (top 2)

Extraire des 2 premiers résultats organiques (skip Pinterest/forums) :
- Le **contrat** : ingrédients attendus, temps total, difficulté, matériel, étapes, nutrition — ce que tous couvrent.
- **L'écart** : ce que personne ne couvre = l'histoire du plat, la cause physique d'une étape, l'erreur assumée.

### 3. Rédaction (voice Bertyn)

- **Intro (800–2000 chars, 2-4 paragraphes)** : ouverture concrète (un moment vécu en cuisine — jamais « Vous êtes-vous déjà demandé… », jamais « L'été est là »). Y tisser **les réponses PAA du cluster** : quantités par personne (500 g de moules = 2 kg pour quatre), temps réel, le vin, le test de cuisson. L'intro est la zone SEO principale de la recette — elle rend AU-DESSUS des ingrédients.
- **Steps (champ `step`, une string)** : **une étape par ligne** (séparées par `\n`, le template prend le premier paragraphe). Ordre chronologique strict, chaque étape avec son repère physique (« jusqu'à ce que les bords frémissent », « doré, pas bruni »). 6-10 étapes.
- **Ton** : première personne, ce qui surprend, l'erreur assumée une fois, l'aparté entre parenthèses. Pas de triades, pas d'emoji, pas de « Délicez-vous ».

### 4. Couverture et images (media loop)

Règle **nom complet du plat** (jamais l'ingrédient seul) — détails dans `../jdc-article-writer/references/image-selection-criteria.md` :

1. `list-media` — image existante ?
2. `search-stock-media` (nom complet du plat EN + 1-2 ingrédients, `rerank: true`) → `recommendedId`
3. `import-stock-media` (attribution auto)
4. Génération locale (prompt EN complet : plat + dressage + lumière + no text/hands/logos, 4:3) → compression → `upload-media` (base64)

La **cover** = la photo qui montre le plat fini entier (pas une coupe mystérieuse) — `coverBlobPathname` = la clé de stockage (`uploads/<fichier>`), + `coverAltText` descriptif FR.

### 5. Création via `create-recipe` (brouillon)

Les champs, leurs contraintes et pièges — la table complète des unités et la méthode nutrition sont dans `references/units-and-nutrition.md` :

| Champ | Contrainte | Piège |
|---|---|---|
| `title` | ≤ 60 chars, requête exacte devant | jamais « Recettes de plat … » |
| `intro` | 800–2000 chars | les réponses PAA dedans (voir §3) |
| `slug` | keywords, tirets, sans date/saison | à poser explicitement |
| `ingredients[]` | `{ name, qty?, unit? }` | **unit enum stricte** : `none, g, mg, kg, l, ml, cuillere_soupe, cuillere_cafe, tasse` — pas d'accents, pas d'autres unités ; les pincées/bouchées vont dans le `name` |
| `step` | string unique, `\n` entre étapes | 6-10 lignes, ordre chronologique |
| `utensils[]` | `{ name, note?, affiliateUrl? }` | **monétisation** : vrais produits testés + disclosure dans l'article |
| `nutrition` | `{ calories, glucides, lipides, proteine, sucre, sodium }` (strings) | **par portion**, unités dans la valeur (« 450 kcal », « 18 g ») |
| `difficulty` | `easy/medium/hard` | cohérent avec le temps et les techniques |
| `time` | minutes totales (int) | = prepTimeMinutes + cookTimeMinutes |
| `servings` | int | cohérent avec les qtés d'ingrédients |
| `coverBlobPathname` | `uploads/<fichier>` | + `coverAltText` + `coverDescription` |
| `categoryId` | après `list-article-categories` | — |
| `status` | **toujours draft** | la publication est manuelle (humain) |

`create-recipe` ne publie jamais. `update-recipe` édite en place (live compris) — **ne jamais changer le statut**.

### 6. SEO

`upsert-seo` `{ contentType: 'recipe', contentId, description, keywords }` :
- Description 140–155 chars : requête exacte + quantité PAA + bénéfice
- Keywords : requête primaire + variantes réelles (pas de junk)

Le **schema Recipe** est auto-généré par le template depuis ces champs — un champ manquant (temps, ingrédients, nutrition) = un trou dans le schema. YGG-82 suit l'ajout author/recipeCuisine au niveau template.

### 7. Review — deux passes

**Passe 1 — Correction** : faits (temps, quantités, températures vs sources), français, unités de l'enum, cohérence servings↔ingrédients↔étapes, liens internes ≥ 2 (ciblés et vivants — vérifier qu'ils existent), alt de cover présent, meta 140-155.

**Passe 2 — Voix** : checklist anti-slop (10 points, fichier article), verdict court, aparté, cause physique dans une étape, l'empreinte vécue. Relire à voix haute — rien qu'on ne dirait pas à table.

**Render check** sur la previewUrl : 200, intro rendue, ingrédients avec unités, étapes ordonnées, tableau nutrition rendu, cover affichée.

### 8. Reporting

`previewUrl` au humain + changelog des deux passes. **La publication est manuelle.** Après publication : GSC `inspection_inspect` + annotation nuxtseo (voir le workflow complet dans `../jdc-article-writer/SKILL.md` §8).

## Monétization

`utensils[].affiliateUrl` : le matériel testé uniquement (cocotte, moule à manqué, poêle) avec disclosure. Jamais sur les ingrédients. Voir `docs/seo-strategy/monetization.md`.
