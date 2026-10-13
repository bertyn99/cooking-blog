# Glossaire et ustensiles — contrat recette JDC

Ingrédients et ustensiles d'une recette sont des **lignes qui pointent vers une fiche glossaire**. Le nom, le slug, l'icône et l'affiliation vivent sur le terme. La recette ne porte que la quantité (ingrédient) et la précision (`note`).

Le site n'affiche un lien `/glossaire/<slug>` que si le terme est **published**. Un stub draft+noindex s'affiche comme texte brut (pas de 404).

Outils MCP : `list-glossary-terms`, `get-glossary-term`, `create-glossary-term`, `update-glossary-term`, `list-glossary-icons`. Scope clé API : `glossary` + `write`.

## Avant `create-recipe` — résoudre chaque ligne

Pour **chaque** ingrédient et **chaque** ustensile :

1. `list-glossary-terms` `{ kind, search, locale: "fr" }` — le search matche nom, slug **et alias**.
2. Terme existant (draft ou published) → `glossaryTermId`. Jamais un second terme pour le même objet.
3. Sinon : stub `{ name }` sur la ligne recette, **ou** `create-glossary-term` si la fiche doit être éditorialisée / affiliée tout de suite.

`glossaryTermId` d'un `ingredient` sur une ligne ustensile (et l'inverse) → `VALIDATION_ERROR`.

## Ingrédients

```json
{ "glossaryTermId": 42, "qty": 250, "unit": "g", "note": "tamisée" }
```

Stub si le terme n'existe pas (crée un draft+noindex, dédupliqué par nom normalisé / alias) :

```json
{ "name": "Farine T55", "qty": 250, "unit": "g" }
```

| Vit sur | Exemple |
|---|---|
| le **terme** | « Amande en poudre » |
| `qty` + `unit` | `250` + `g` — enum stricte, voir `units-and-nutrition.md` |
| `note` | état de préparation : tamisée, émincé, fondu, ciselé, « ou équivalent » |

- **Pas d'unité dans le nom.** « 2 gousses d'ail » → terme « Ail » (ou « Gousses d'ail » s'il existe), `qty: 2`, `unit: "none"`.
- Un `(…)` en fin de `name` stub est strippé vers `note` : `"Piment d'Espelette (une pincée)"` → terme « Piment d'Espelette », note « une pincée ».
- **Formes culinaires** ≠ alias. Amande / amande en poudre / lait d'amande = **trois fiches**, la forme pointe `parentId` vers la racine (Amande). La ligne recette vise **la forme dans le bol**, pas la famille. Si la forme n'existe pas : `create-glossary-term` `{ kind: "ingredient", name, parentId }` — ne pas copier la cover de la famille.
- **Alias** = synonymes / pluriels seulement (œuf / œufs). Jamais « lait d'amande » en alias d'« Amande ».
- **Ne pas fusionner** « farine » et « farine de blé », ni deux produits distincts.
- Pas d'affiliation sur les ingrédients (sauf fiche glossaire rare, hors recette — voir monetization).

## Ustensiles

```json
{ "glossaryTermId": 88, "note": "28 cm" }
```

Stub (icône sémantique optionnelle, **jamais** `affiliateUrl`) :

```json
{ "name": "Poêle en fonte", "note": "28 cm", "iconKey": "pan" }
```

| Vit sur | Exemple |
|---|---|
| le **terme** `kind: "ustensile"` | nom, `iconKey`, `amazonAsin` / `partnerUrl` |
| `note` recette | taille, option : « 28 cm », « ou une cocotte équivalente » |

- Même objet dans la cuisine = **un** terme. Taille / matière ponctuelle → `note`. Produits vraiment distincts (poêle fonte vs antiadhésive) = deux termes.
- **Jamais `affiliateUrl` sur la ligne recette** — le champ n'existe plus. L'achat se résout depuis la fiche : `partnerUrl` **gagne** sur `amazonAsin`.
- Disclosure : le template recette l'affiche tout seul dès qu'un ustensile a une URL résolue. Ne pas la recoller dans l'intro.

### Créer / enrichir une fiche ustensile (affiliation)

1. `list-glossary-terms` `{ kind: "ustensile", search }` — réutiliser.
2. `list-glossary-icons` (filtre `utensilCategory` : `cuisson | preparation | mesure | electro | service`) → `iconKey` sémantique (`pan`, `pot`, `dutch-oven`…). **Jamais** `i-lucide-…` / `i-mdi-…`.
3. `create-glossary-term` ou `update-glossary-term` :

```json
{
  "kind": "ustensile",
  "name": "Cocotte en fonte",
  "iconKey": "dutch-oven",
  "utensilCategory": "cuisson",
  "amazonAsin": "B00EXAMPLE1",
  "description": "Cocotte lourde, 24–28 cm — celle que j'utilise pour le bœuf bourguignon."
}
```

- Un ASIN **ou** un `partnerUrl`, pas les deux en conflit (`partnerUrl` l'emporte).
- Affiliation = matériel **testé**. Poêle, cocotte, moule, thermomètre — pas un lien Amazon sur chaque cuillère en bois.
- `create-glossary-term` est toujours **draft + noindex**. La publication (et le passage `index, follow`) est humaine. `upsert-seo` `{ contentType: "glossary", contentId }` : laisser `noindex,follow` tant que la fiche n'est pas éditorialisée.

### `iconKey` allowlist

| key | FR | catégorie |
|---|---|---|
| `pan` | Poêle | cuisson |
| `pot` | Casserole | cuisson |
| `dutch-oven` | Cocotte | cuisson |
| `wok` | Wok | cuisson |
| `steamer` | Cuit-vapeur | cuisson |
| `oven` | Four | cuisson |
| `stove` | Plaque / feu | cuisson |
| `grill` | Grillade | cuisson |
| `microwave` | Micro-ondes | electro |
| `toaster` | Grille-pain | electro |
| `knife` | Couteau de chef | preparation |
| `cutlery` | Couverts | preparation |
| `spoon` | Cuillère / louche | preparation |
| `bowl` | Saladier | preparation |
| `mortar` | Mortier | preparation |
| `blender` | Mixeur plongeant | electro |
| `processor` | Robot | electro |
| `chef-hat` | Toque | preparation |
| `scale` | Balance | mesure |
| `thermometer` | Thermomètre | mesure |
| `timer` | Minuteur | mesure |
| `cup` | Verre doseur | mesure |
| `fork-knife` | Service | service |

## Après création

Dans le changelog humain : termes **réutilisés** vs **stubs créés** (id + nom + kind). Un stub n'est pas une fiche à publier — signaler ceux qui méritent une vraie editorialisation (ustensile affilié, ingrédient rare).
