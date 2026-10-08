# Sélection d'images — workflow de décision (stock vs génération)

> Passé d'images d'un article : la médiathèque d'abord, le stock Pexels ensuite, la génération AI en dernier recours. Chaque choix est validé contre des critères explicites — soit par le re-rank du tool `search-stock-media` (modèle de décision gemma côté CMS), soit par toi en appliquant cette liste.

## Ordre de décision

1. **`list-media`** (`prefix: 'uploads/'`, mots-clés du plat) — une image existante adéquate gagne toujours. Évite les doublons et les coûts.
2. **`search-stock-media`** (query EN = plat + ingrédients clés, `orientation: 'landscape'`, `perPage: 8`) — le re-rank (`rerank: true` par défaut) retourne `ranking` (score 0-10 + `keep` + raison FR) et `recommendedId`.
3. **`import-stock-media`** avec `recommendedId` (ou le meilleur candidat `keep: true` après lecture des raisons). Déduit l'attribution automatiquement.
4. **`generate-media`** uniquement si le stock échoue aux critères (aucun `keep: true`) OU si le sujet est introuvable en stock (plat régional, présentation très spécifique).

## Critères d'une image de stock valide

Appliqués par le re-rank, à vérifier par toi avant l'import :

| # | Critère | Rejet si |
|---|---|---|
| 1 | **Sujet** | L'alt ne décrit pas le plat/subject (variante proche OK, ingrédient clé OK) |
| 2 | **Sujet unique** | Collage, flat-lay multi-plats, scène sans rapport |
| 3 | **Qualité photo culinaire** | Ingrédients bruts quand on veut un plat fini (et inversement) ; présentation peu appétissante |
| 4 | **Pas de surcouche** | Texte, watermark, packaging, logo, graphisme non-culinaire |
| 5 | **Géométrie** | Landscape ≥ 800px de large (le site rend en 4:3 ~w_800) ; portrait toléré si le sujet est excellent |

Un candidat qui échoue 1, 2 ou 4 → `keep: false`, ne pas importer même avec un score élevé.

## Critères d'une image générée valide

- **Photoréalisme culinaire** : un plat unique, dressé, profondeur de champ naturelle — pas d'illustration 3D, pas de style cartoon
- **Aucun texte** dans l'image (les modèles écrivent mal le FR — jamais de mots sur l'image)
- **Aucun logo/marque**, pas de main si évitable
- **Cohérence culinaire** : les garnitures/accessoires ne doivent pas contredire la recette (pas de persil sur un dessert)
- Génération = dernier recours : le mentionner dans les notes d'article si utilisé

## Prompt de génération (modèle EN)

```
Professional food photography of <dish in English>, served on <rustic ceramic / dark slate>,
natural window light, shallow depth of field, appetizing garnish (<accurate garnish>),
rustic wooden table, 45-degree angle, no text, no hands, no logos
```

- Articles : `aspectRatio: '4:3'` · Cover : `'16:9'` possible selon le rendu (défaut cover site : 4:3)
- Modèle : défaut (`google/nano-banana-2`) ; fallback auto `flux-2-klein-9b` si échec

## Règles d'écriture après import

- Markdown natif : `![alt FR descriptif](/uploads/<pathname>)` — alt en français, décrit le plat vu (pas le nom du fichier)
- Une image par item de listicle, placée sous l'intitulé de l'item
- Plats sans média trouvé : les noter (section "sans média") pour une passe de génération future — ne jamais référencer un chemin inexistant
- Crédit Pexels : l'attribution est stockée en médiathèque ; mentionner le photographe dans l'article si la licence l'exige (Pexels : pas d'obligation, apprécié)
