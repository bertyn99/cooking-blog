# Checklist recette — création et review

## Champs `create-recipe` (tout doit être rempli, sauf exception notée)

- [ ] `title` ≤ 60 chars, requête exacte devant (« Recette de X : … »), pas de saison/date
- [ ] `slug` posé explicitement : keywords, tirets, sans date/saison
- [ ] `intro` 800–2000 chars : ouverture concrète (jamais opener banni), réponses PAA du cluster (quantités/pers, temps, test de cuisson, vin), 1 histoire courte max
- [ ] `excerpt` 1-2 phrases (dek)
- [ ] `ingredients[]` : chaque ligne = `{ name, qty?, unit? }` — unit dans l'enum stricte, préparation dans le nom, pas d'unité dans le nom
- [ ] `step` : **lignes numérotées « 1. … »** (une par ligne, `\n`), 6-12 étapes, ordre chronologique, repères physiques — le composant web affiche son propre numéro et retire le préfixe « N. » + le point final
- [ ] `utensils[]` : le matériel réellement utile — `affiliateUrl` seulement si produit testé (+ disclosure)
- [ ] `nutrition` : par portion, 4 clés minimum (calories, glucides, lipides, proteine), unités dans les valeurs
- [ ] `difficulty` + `time` + `prepTimeMinutes` + `cookTimeMinutes` + `servings` cohérents entre eux et avec les étapes
- [ ] `coverBlobPathname` + `coverAltText` + `coverDescription` (media loop, nom complet du plat)
- [ ] `categoryId` depuis `list-article-categories`
- [ ] `locale` : `fr`

## Schema Recipe (auto-généré par le template)

Le web émet le schema depuis les champs : name, totalTime, datePublished, dateModified, author, keywords, recipeCategory. **Un champ vide = un trou dans le schema** → remplir time, publishedAt (auto au publish), category, keywords (upsert-seo). YGG-82 suit l'ajout de recipeCuisine/calories/nutrition au niveau template — les champs nutrition de la recette y alimenteront.

## Liens internes (≥ 2)

- 1 **up** : hub `/recette/recettes-du-monde` ou la catégorie
- 1 **sideways** : une recette ou un article lié (vérifier la cible existe — les 404 ont déjà été livrés)
- Ancres contextuelles variées, jamais « cliquez ici »

## Passe 1 — Correction

- [ ] Faits vs sources : temps, températures, quantités, origine du plat (légende ≠ archive)
- [ ] Français : grammaire, accords, ponctuation
- [ ] Comark/source : pas de `**` en titres, pas de HTML cru, pas d'entités échappées
- [ ] Unités dans l'enum, cohérence servings ↔ ingrédients ↔ étapes
- [ ] Chaque étape a un repère physique ou temporel
- [ ] Meta 140–155, keywords propres, excerpt présent
- [ ] Liens internes : cibles vérifiées, ancres naturelles

## Passe 2 — Voix

- [ ] Anti-slop 10 points (fichier antislop-fr.md du skill article)
- [ ] ≥ 1 cause physique (« la vapeur soulève la pâte », « l'eau gazeuse fait la croûte »)
- [ ] ≥ 1 aparté entre parenthèses + 1 verdict court
- [ ] 1 empreinte vécue (l'erreur du premier essai, ce que le primeur a dit)
- [ ] Rythme : long/short, un paragraphe ≤ 6 mots

## Render check (previewUrl)

- [ ] 200, pas d'erreur boundary
- [ ] Intro rendue, ingrédients avec unités, étapes ordonnées, tableau nutrition
- [ ] Cover affichée, images inline (si FAQ : section rendue)
- [ ] Liens internes résolus
- [ ] Pas de placeholder ni de texte template
