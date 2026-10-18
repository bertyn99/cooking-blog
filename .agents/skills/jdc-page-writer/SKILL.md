---
name: jdc-page-writer
description: |
  Write French technique pages for journalducuistot.fr under
  /techniques-culinaires: one cooking verb, or one kitchen decision.
  Comark: ![alt](/uploads/…), ::callout, ::grid, ::table, ::faq, mermaid fence.

  Use when: rewriting saisir, braiser, a code page, create-page inserting
  a hero, a pipe table that renders empty, or a callout titled Info / Astuce.
---

# JDC page writer

Pages under [journalducuistot.fr/techniques-culinaires](https://journalducuistot.fr/techniques-culinaires) teach a cook to **do one thing**. **Bertyn Boulikou** shows the pan, then the reason. A page that ranks is a page where the reader can finish the gesture without opening another tab.

Two types. Declare which one in the first line of the working notes.

| Type | The page is | Example |
|---|---|---|
| **Method** | A sequence for one verb: heat, turn, stop | Saisir, braiser, frire, pocher |
| **Code** | A decision reused on many methods | Mise en place, sel / acide / gras, 70 °C ANSES vs « saignant » |

A method draft that grows a reusable rule moves that rule to a code page. A code draft that grows a timed dish moves it to the recipe skill.

Non-negotiable: **one URL per verb**, **the query is the task** (« comment braiser », never the head term « techniques culinaires » alone), **every number wears its source**, **drafts only** (never publish via MCP), **voice always**.

**Toolchain:** `nuxtseo` CLI (site `s_7a49d74f`) + **Search Console MCP** (`sc-domain:journalducuistot.fr`) + **jdc-cms MCP** (`list-pages`, `get-page`, `create-page`, `update-page`, `upsert-seo`, `list-recipes`). Protocole CLI : skill `nuxtseo-cli`. Voix : `../jdc-article-writer/references/antislop-fr.md` et `voice-arsenal.md`.

**Cartes :** `references/page-map.md` (ids réels), `references/method-page.md`, `references/code-page.md`, `references/page-blocks.md` (images et blocs Comark, **partagé avec le skill article**).

## Workflow

### 0. Inventaire — une URL par geste

`list-pages` `{ locale: "fr", pageSize: 100 }` (pas de filtre search : lire `slug`, `title`, `parentId`). Une page existe déjà sur ce verbe ou cette décision → **`update-page`**, jamais une deuxième création.

Ids et parents au 2026-10-15 : `references/page-map.md`. Revérifier avant d'écrire. Les fiches épices vides ne se remplissent pas ici (article ou glossaire).

`create-page` n'a pas de champ `slug`. Le slug est `slugify(name)` à la création seulement. `update-page` ne change pas le slug. Sur une page déjà en ligne, ne pas « réparer » le slug en changeant `name`.

### 1. Keyword gate — la requête écrite dans la page

Obligatoire en création et en update. Lire d'abord ce qui est déjà écrit (`get-page` : `title`, `slug`, le `#` du corps, `seoMeta.keywords`).

La requête publique est une tâche : « comment saisir une viande », « comment braiser », « cuisson vapeur légumes ». Elle est confirmée par **Search Console MCP ou le CLI `nuxtseo`** (l'autre si le premier est vide ou un refus).

1. **Search Console MCP** (`user-search-console`), propriété `sc-domain:journalducuistot.fr` :
   - `analytics_query`, dimension `query`, filtre sur la tâche (3 derniers mois). Les impressions existantes gagnent.
   - Sinon `seo_keywords_research` `{ keywords: ["<requête>"], country: "fr", language: "fr", type: "stats" }`, puis `type: "related"`.
2. **`nuxtseo` CLI** — site `s_7a49d74f`, toujours `--json --no-input`. Skill `nuxtseo-cli`. Ne pas inventer de flags.
   - Demande retenue : `nuxtseo search analytics keywords --site s_7a49d74f --search "<requête>" --period 3m --json`.
   - Volume : `nuxtseo research keywords "<graine 1-3 mots>" --site s_7a49d74f --no-input --location-code 2250 --min-volume 10 --json`. Défaut `2840` = États-Unis. Une graine de plus de 3 mots est refusée (exit `0`, `keywords: []`) : « comment saisir une viande » ne passe pas — la graine est `saisir viande` ou `cuisson braiser`. Lire `data.message`. Le SERP de la tâche complète : `nuxtseo research serp "<tâche>" --site s_7a49d74f --no-input --location-code 2250 --json` (2 à 200 caractères).

Le `title`, le `#` unique, et `upsert-seo.keywords` portent cette tâche. Sinon, changer la copie.

**Livrable avant d'écrire :** type (method / code / hub) + requête + outil qui l'a confirmée + 3–4 questions « Autres questions » + 2 URLs concurrentes.

### 2. Type et parent

- **Feuille méthode** : parent = `methodes-de-cuisson` (sous le pilier). Squelette : `references/method-page.md`.
- **Feuille code** : parent = le hub `code-de-la-cuisine`. S'il n'existe pas, le créer d'abord comme enfant de `techniques-culinaires`, `name` tel que le slug soit `code-de-la-cuisine` (`code de la cuisine`). Une seule page code par tâche — ne pas générer tout le cluster d'un coup. Squelette : `references/code-page.md`.
- **Hub ou sous-hub** : une section courte par enfant réel, chacune avec un lien vers la feuille. Le pilier actuel (essai d'accueil, épices, pâtisserie, newsletter) se réécrit dans cette forme. L'organisation concentration / expansion / mixte reste sur l'URL qui l'a déjà ; une page neuve ne s'appuie pas dessus. Le partage utile est : cuisson avec brunissement, ou sans.

`parentId` est l'id du parent, pas un chemin. Le chemin public est la chaîne des slugs. Un lien interne est un chemin absolu (`/techniques-culinaires/methodes-de-cuisson/saisir-viande-parfaitement`).

### 3. Rédaction

Comark markdown. Le template public (`BasePageBody`) n'imprime pas `title` : le seul H1 est le `#` du corps. Un deuxième `#` est un bug.

- `##` et `###` sans gras autour du titre (`## **...**` a déjà cassé des feuilles).
- Photos, `::callout` / `::grid` / `::table` / `::faq`, Mermaid : `references/page-blocks.md`. Pas de `::timeline` ni de `::carousel` sur une feuille technique.
- Un composant qui manque se crée dans `packages/shared/blocks/<tag>/`. La page appelle `::<tag>`.
- Ouverture : le geste et la condition qui le fait marcher (poêle assez chaude pour colorer, liquide à mi-hauteur). Pas de « Bienvenue », pas de « Dans cet article ».
- Un chiffre = la source dans la phrase + ce qu'il mesure (huile, thermostat du four, liquide, à cœur). Deux sources en désaccord : les deux chiffres restent. Détail des conflits connus : le squelette du type.
- Liens : un vers le parent, le parent doit renvoyer vers cette feuille, deux ou trois recettes publiées (`list-recipes`) qui utilisent le geste, un frère seulement s'il répond à la question suivante (saisir → braiser). Vérifier que la cible existe. Refuser `/bases-culinaires/`, `/recettes/` (pluriel), `/glossaire-culinaire`, `/guide-ustensiles`.

### 4. Écriture CMS

`create-page` (brouillon, ne publie jamais) :

| Champ | Contrainte |
|---|---|
| `name` | Devient le slug. Choisir les mots dont le slugify est le slug voulu. Ne pas viser un titre long ici. |
| `title` | ≤ 60 caractères, tâche exacte devant. C'est le `<title>` / OG, pas un H1 de plus. |
| `content` | Toujours fourni. Omis = blocs hero / newsletter par défaut. |
| `excerpt` | 1–2 phrases |
| `parentId` | Id du parent (§2). Jamais la home. |
| `locale` | `fr` |
| `isHome` | Ne pas envoyer. |

`update-page` édite en place, y compris une page publiée. Ne pas envoyer de statut. Ne pas renvoyer `parentId` sauf si le déplacement est la tâche. Ne pas envoyer `isHome`.

Puis `upsert-seo` `{ contentType: "page", contentId, description, keywords }` :

- Description 140–155 caractères : la tâche + le test de réussite (fourchette qui s'enfonce, huile qui ne fume pas).
- Keywords : la requête confirmée au §1 + variantes réellement renvoyées par l'outil.

Le site émet déjà `BreadcrumbList` depuis la chaîne de parents. Ne pas coller de JSON-LD dans le markdown. Pas de `HowTo`, pas de `Recipe`, pas d'`Article` : le bloc `::faq` émet `FAQPage` + `Question` (Unhead / Nuxt SEO). Google ne montre plus les rich results FAQ (2026-05-07) ; le schema reste valide.

### 5. Review — deux passes

**Passe 1 — Correction**

- Type déclaré, et le corps le respecte (séquence, ou décision).
- Un seul `#`. Titres `##` sans `**`.
- Rejouer `references/page-blocks.md` : image markdown, callout sans titre générique, `::table` / `::faq` JSON (pas de pipes), légendes de grille, branches du diagramme.
- Chaque température a une source et un objet. Les degrés de goût (bleu, saignant) et les degrés ANSES ne partagent pas une ligne.
- Gate §1 rejoué sur `title`, `#`, et keywords.
- Chaque lien interne répond (pas de `/bases-culinaires/`). Parent et feuilles se lient dans les deux sens.
- Meta 140–155. Excerpt présent.

**Passe 2 — Voix**

Checklist anti-slop du skill article. Une cause physique. Un mythe français encore répété, défait en une phrase. Un aparté. Rien qu'on ne dirait pas au-dessus de la poêle.

**Render check** sur `previewUrl` : 200, un H1, les étapes ou les décisions visibles, le callout du mythe (icône + phrase, pas « Attention » à l'écran), les photos dans l'ordre de la grille, le `::table` rempli (pas un bloc vide), le SVG Mermaid dessiné s'il y en a un, les liens résolus, pas de hero/newsletter parasite sur une feuille technique.

### 6. Reporting

`previewUrl` + type + parent id + requête et outil qui l'a confirmée + changelog des deux passes. **La publication est manuelle.** Après publication humaine : GSC `inspection_inspect` et annotation nuxtseo, comme `../jdc-article-writer/SKILL.md` §8.

## Hors de ce skill

Recettes → `jdc-recipe-creator`. Articles (histoire, listicle, matériel) → `jdc-article-writer`. Épices essentielles : les deux fiches vides du CMS ne se remplissent pas comme une méthode. Affiliation : une page méthode peut nommer la cocotte ou la poêle et lier la fiche glossaire ustensile ; le lien affilié vit sur cette fiche, pas dans le corps.
