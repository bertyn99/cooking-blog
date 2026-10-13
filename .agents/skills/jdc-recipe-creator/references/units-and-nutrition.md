# Unités et nutrition — les règles de la recette JDC

## L'enum des unités (stricte)

Le champ `unit` d'un ingrédient n'accepte QUE ces valeurs (sans accents, en minuscules) :

| Valeur | Sert à | Exemple d'ingrédient |
|---|---|---|
| `none` | pincées, gousses, branches, pièces, boîtes — tout ce qui ne se mesure pas | `{ glossaryTermId, qty: 2, unit: "none" }` |
| `g` | grammes (farine, beurre, lardons) | `{ glossaryTermId, qty: 250, unit: "g" }` |
| `mg` | milligrammes (rare — sel fin en pâtisserie de précision) | `{ glossaryTermId, qty: 500, unit: "mg" }` |
| `kg` | kilogrammes (moules, viandes en gros) | `{ glossaryTermId, qty: 2, unit: "kg" }` |
| `l` | litres (lait, bouillon) | `{ glossaryTermId, qty: 0.5, unit: "l" }` |
| `ml` | millilitres (huile, vin, crème) | `{ glossaryTermId, qty: 250, unit: "ml" }` |
| `cuillere_soupe` | cuillère à soupe (huile, farine, crème) | `{ glossaryTermId, qty: 3, unit: "cuillere_soupe" }` |
| `cuillere_cafe` | cuillère à café (épices, levure, extrait) | `{ glossaryTermId, qty: 1, unit: "cuillere_cafe" }` |
| `tasse` | tasse (amandes, raisins secs) | `{ glossaryTermId, qty: 1, unit: "tasse" }` |

### Pièges d'écriture des ingrédients

Préférer `{ glossaryTermId, qty, unit, note }` après `list-glossary-terms`. Le stub `{ name }` ne sert que si le terme n'existe pas (draft+noindex). Contrat complet : `glossary-and-utensils.md`.

- **Pas d'unité dans le nom du terme** : la quantité vit dans `qty` + `unit`. « 2 gousses d'ail » → terme « Ail » (ou « Gousses d'ail » s'il existe), `{ qty: 2, unit: "none" }`.
- **Préparation dans `note`**, pas dans le nom : « émincées », « ciselé », « tamisée », « fondu ». Le terme reste « Échalotes », « Persil », « Farine T55 ».
- **Pas d'accents ni de pluriels dans l'enum** : `cuillere_soupe` (jamais `cuillère_à_soupe`).
- **Les pincées** : `unit: "none"` et la pincée dans `note` (`note: "une pincée"`), qty omis ou 1. Un `(…)` en fin de `name` stub est strippé vers `note`.
- **Fraction de quantité** : décimales acceptées (0.5 l = 50 cl).

## La nutrition — par portion, honnête, indicatif

Le champ `nutrition` est un objet à 6 clés **texte**, rendu tel quel dans le tableau de la recette. Les unités vivent DANS la valeur.

```json
{
  "calories": "450 kcal",
  "glucides": "38 g",
  "lipides": "22 g",
  "proteine": "28 g",
  "sucre": "6 g",
  "sodium": "1,2 g"
}
```

### Méthode d'estimation (dans l'ordre de préférence)

1. **Tables CIQUAL (Anses)** — référence française, valeurs pour 100 g. Calcul : (qté ingrédient ÷ 100) × valeur CIQUAL, sommé sur tous les ingrédients, ÷ nombre de portions.
2. **Étiquettes des produits réels** quand la recette en cite (pâte feuilletée du commerce, chorizo de marque).
3. **Fourchette prudente** si un ingrédient est incertain : arrondir vers le haut les lipides, vers le bas les protéines — mieux vaut sous-promettre.

### Règles de présentation

- **Par portion**, jamais pour le plat entier (les lecteurs cherchent « combien de calories par part »).
- Arrondir : calories au multiple de 5, macros au gramme, sodium en g avec une décimale.
- Les 6 clés sont optionnelles individuellement mais les 4 principales (calories, glucides, lipides, proteine) doivent être là ensemble — un tableau à moitié vide fait amateur.
- Rester **indicatif** : jamais de claim santé (le SERP santé est le mauvais concurrent — règle anti-slop).

### Le cluster PAA nutritionnel

Les questions « combien de calories… », « est-ce calorique… » appartiennent à l'**intro** (une phrase avec la valeur par portion), pas seulement au tableau. Exemple : « Comptez 450 kcal la part — la moitié d'une quiche du commerce. »

## serv ings, temps et cohérence

- `servings` = le nombre qui rend les quantités d'ingrédients justes. Vérifier le calcul : si 2 kg de moules et servings 4 → 500 g/pers ✓.
- `time` = `prepTimeMinutes` + `cookTimeMinutes` (le template affiche `time` min).
- `difficulty` honest : `easy` = une seule technique de cuisson ; `medium` = une étape délicate (retourner une tortilla, pâte à choux) ; `hard` = plusieurs techniques chronométrées.
