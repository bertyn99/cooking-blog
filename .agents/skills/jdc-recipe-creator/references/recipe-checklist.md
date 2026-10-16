# Checklist recette — création et review

## Champs `create-recipe` (tout doit être rempli, sauf exception notée)

- [ ] `title` ≤ 60 chars, requête exacte devant (« Recette de X : … »), pas de saison/date
- [ ] `slug` posé explicitement : keywords, tirets, sans date/saison
- [ ] `intro` 800–2000 chars : ouverture concrète (jamais opener banni), réponses PAA du cluster (quantités/pers, temps, test de cuisson, vin), 1 histoire courte max
- [ ] `excerpt` 1-2 phrases (dek)
- [ ] Glossaire résolu **avant** création : `list-glossary-terms` pour chaque ingrédient et ustensile (voir `glossary-and-utensils.md`)
- [ ] `ingredients[]` : `{ glossaryTermId, qty?, unit?, note? }` — à défaut stub `{ name, qty?, unit?, note? }` ; unit dans l'enum stricte ; préparation dans `note` (pas un nouveau terme) ; forme culinaire = fiche `parentId`, pas un alias
- [ ] `steps[]` : `{ instruction }` × 6-12, ordre chronologique, repères physiques — puis `step` markdown « 1. … » via `update-recipe` si le preview public ne les affiche pas
- [ ] `utensils[]` : `{ glossaryTermId, note? }` (taille / option dans `note`) — **pas d'`affiliateUrl`** ; icône / ASIN / `partnerUrl` sur la fiche `ustensile`
- [ ] `nutrition` : par portion, 4 clés minimum (calories, glucides, lipides, proteine), unités dans les valeurs
- [ ] `difficulty` + `time` + `prepTimeMinutes` + `cookTimeMinutes` + `servings` cohérents entre eux et avec les étapes
- [ ] `coverBlobPathname` + `coverAltText` + `coverDescription` (media loop, nom complet du plat)
- [ ] `categoryId` depuis `list-recipe-categories`
- [ ] `locale` : `fr`

## Schema Recipe (auto-généré par le template)

Le web émet le schema depuis les champs : name, totalTime, datePublished, dateModified, author, keywords, recipeCategory. **Un champ vide = un trou dans le schema** → remplir time, publishedAt (auto au publish), category, keywords (upsert-seo). YGG-82 suit l'ajout de recipeCuisine/calories/nutrition au niveau template — les champs nutrition de la recette y alimenteront.

## Liens internes (≥ 2)

- 1 **up** : hub `/recette/recettes-du-monde` ou la catégorie
- 1 **sideways** : une recette, un article, ou une fiche glossaire **published** (`/glossaire/<slug>` — un stub draft n'a pas de `path`)
- Ancres contextuelles variées, jamais « cliquez ici »

## Passe 1 — Correction

- [ ] Faits vs sources : temps, températures, quantités, origine du plat (légende ≠ archive)
- [ ] Français : grammaire, accords, ponctuation
- [ ] Comark/source : pas de `**` en titres, pas de HTML cru, pas d'entités échappées
- [ ] Unités dans l'enum, cohérence servings ↔ ingrédients ↔ étapes
- [ ] Chaque ingrédient / ustensile pointe un terme du bon `kind` (pas de mismatch)
- [ ] Stubs volontaires seulement ; pas de doublon glossaire (alias plutôt que nouveau terme)
- [ ] Ustensiles : pas d'`affiliateUrl` sur la ligne ; affiliation éventuelle sur la fiche
- [ ] Chaque étape a un repère physique ou temporel
- [ ] Meta 140–155, keywords propres, excerpt présent
- [ ] Mot-clé de la recette (début du title, slug, deux premières phrases de l'intro, `seo.keywords`) revérifié via Search Console MCP (`analytics_query` ou `seo_keywords_research`, `sc-domain:journalducuistot.fr`) **ou** `nuxtseo` (`search analytics keywords` / `research keywords --location-code 2250`). La formulation livrée est celle confirmée par l'outil.
- [ ] Liens internes : cibles vérifiées, ancres naturelles

## Passe 2 — Voix

- [ ] Anti-slop 10 points (fichier antislop-fr.md du skill article)
- [ ] ≥ 1 cause physique (« la vapeur soulève la pâte », « l'eau gazeuse fait la croûte »)
- [ ] ≥ 1 aparté entre parenthèses + 1 verdict court
- [ ] 1 empreinte vécue (l'erreur du premier essai, ce que le primeur a dit)
- [ ] Rythme : long/short, un paragraphe ≤ 6 mots

## Render check (previewUrl)

- [ ] 200, pas d'erreur boundary
- [ ] Intro rendue, ingrédients avec unités, étapes ordonnées, bloc Ustensiles, tableau nutrition
- [ ] Lien `/glossaire/…` seulement sur les termes published (sinon nom en texte)
- [ ] « Acheter » + disclosure seulement si une fiche ustensile a un ASIN / `partnerUrl`
- [ ] Cover affichée, images inline (si FAQ : section rendue)
- [ ] Liens internes résolus
- [ ] Pas de placeholder ni de texte template
