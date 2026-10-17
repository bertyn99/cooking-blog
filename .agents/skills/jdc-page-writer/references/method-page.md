# Squelette — page méthode

Une méthode = un verbe. Le lecteur repart en sachant le faire, et quelle recette du site l'utilise.

La première ligne des notes de travail dit : `type: method`.

## Ce que la page sépare tout de suite

Nommer le milieu, la quantité de gras, le couvercle ou pas, et si la surface doit brunir. Saisir, sauter, frire et poêler se confondent dès que cette ligne manque.

- Saisir / sauter : peu de gras, très chaud, sans couvercle, surface colorée.
- Frire : immersion, huile 140–180 °C de travail, plafond 180 °C (la DREETS : l'huile ne fume pas et ne mousse pas).
- Pocher : liquide frémissant, pas d'ébullition. Départ à chaud et départ à froid n'ont pas le même but.
- Braiser : colorer, puis couvert, liquide qui ne recouvre pas la pièce. L'étouffée est la voisine avec encore moins de liquide ajouté.
- Rôtir : air chaud, découvert. Griller : chaleur rayonnante directe.

Ne pas construire une page neuve sur le triptyque concentration / expansion / mixte. Les fiches d'école l'utilisent encore ; le référentiel CAP l'a quitté pour « cuisson avec ou sans brunissement ». L'URL `methodes-de-cuisson` peut garder son plan actuel. Une feuille neuve ne le reprend pas comme colonne vertébrale.

## Sections, dans cet ordre

1. **Le verbe, séparé de ses deux voisins** — milieu, gras, couvercle, brunissement. La tâche (« Comment saisir une viande ») est le `#` unique.
2. **Pour quel morceau, et lequel cette méthode rate.** Une pièce tendre veut le feu sec et court. Une pièce riche en collagène veut le couvercle et le temps.
3. **Une cause.** Surface mouillée qui reste vers l'ébullition, collagène qui devient gélatine, huile qui conduit. Pas un cours de chimie.
4. **Le geste, et comment il échoue.** Pièces de même taille. Trop de viande dans la poêle : elle bout au lieu de colorer. Trop de liquide : le braiser devient un bouilli.
5. **Un test de fin.** Sonde pour un cœur, fourchette pour un braisé, couleur et huile qui ne fume pas pour une friture. Pas le test du pouce.
6. **Un mythe français encore répété**, en un appel `::callout{type="warning"}`, avec le contre-test.
7. **Le récipient et le danger dans la même phrase.** Fonte ou inox pour une saisie forte. Cocotte lourde et couvercle pour un braisé. Friture : aliment sec, huile qui ne fume pas.
8. **Questions fréquentes** — 3 ou 4, prises du bloc « Autres questions » de la requête. Visibles. Pas de schema FAQ dans le markdown.
9. **La suite** — lien vers le parent, deux ou trois `/recette/…` publiées, un frère si c'est la question d'après.

Pas de longueur cible. Couvrir ces neuf points. Une feuille tient en général entre 4 000 et 8 000 caractères. Au-delà, une décision réutilisable doit partir sur une page code.

## Chiffres — imprimer la source et l'objet

Si deux sources ne disent pas la même chose, les deux restent. Ne pas fabriquer un « Maillard commence à ».

- **Surface mouillée.** L'eau liquide tient la surface près de 100 °C. Kenji (Serious Eats, « old wives' tales about cooking steak ») : le brunissement rapide une fois la surface sèche, pas un seul seuil à publier. Hervé This : le brunissement de la viande n'est pas « la réaction de Maillard » toute seule.
- **La croûte n'enferme pas les sucs.** Même test Kenji : deux steaks au même cœur, celui saisi d'abord n'est pas le plus juteux. La-viande.fr et des fiches AFA disent encore l'inverse. Tenir le test.
- **Braiser.** Christina Blais (Ricardo) : liquide juste sous l'ébullition, 85–90 °C, liquide à mi-hauteur parce que la viande rend du jus. La-viande.fr dit « mouiller à hauteur », ce qui est plus de liquide. Le thermostat du four (150 °C, 160 °C) n'est pas la température du liquide. La fin, c'est la fourchette, pas le minuteur.
- **Pocher.** Frémissement. Les fourchettes d'école vont d'environ 65–75 °C à 71–82 °C. Écrire l'intervalle de la source ouverte, pas une moyenne.
- **Frire.** Bande de travail souvent citée 140–180 °C. Plafond : ne pas dépasser 180 °C, huile qui ne fume pas (DREETS Occitanie). Le décret du 26 février 2008 vise les graisses de friture professionnelles (composés polaires, polymères) : le dire si on le cite, ne pas le transformer en consigne de friteuse maison.
- **Goût et sécurité.** Les degrés de goût et les degrés ANSES ne partagent pas une ligne. Phrases et URLs : `code-page.md`.
- **Repos sur le plan de travail.** Kenji a mesuré une pièce qui ne montait presque pas en 20 minutes. « Sortez la viande 20 minutes pour qu'elle soit à température ambiante » ne se publie pas comme un fait.
- **Sel.** Les labos ne s'accordent pas sur le moment. Ce qui tient : le sel ne brûle pas ; une surface mouillée retarde le brunissement. Écrire le désaccord plutôt qu'une règle unique.

## Mythe — un seul par page

Choisir celui que cette méthode traîne encore :

- La croûte enferme les sucs (saisir, rôtir, griller).
- Le sel brûle, ou il faut toujours saler à la fin (saisir).
- Vingt minutes sur le comptoir égalent la température ambiante (saisir, rôtir).
- Retourner une seule fois, présenté comme une loi (Kenji : sur un steak, retourner souvent cuit plus vite et plus régulièrement ; Ricardo dit de laisser les cubes d'une sauteuse jusqu'à coloration — le geste dépend de la pièce).
- Braiser = faire bouillir avec un couvercle.

## Forme

````markdown
# Comment saisir une viande

Deux phrases : le geste, et la condition (poêle assez chaude, surface sèche).

## En quoi saisir n'est pas frire ni pocher

Milieu, gras, couvercle, brunissement. Une phrase par voisine.

## Quelle pièce, et laquelle laisser

## Pourquoi la surface colore

Une cause.

## Le geste

Étapes numérotées. Chaque étape a un repère (son, couleur, liquide).

Une photo pleine largeur si la main doit se copier. Deux photos côte à côte seulement pour deux résultats au même point d'arrivée — syntaxe dans `page-blocks.md`. Un diagramme Mermaid seulement s'il y a deux branches (tendre ou coriace), pas pour répéter ces étapes. Un `::table` si plusieurs pièces ou plusieurs températures, pas une grille de couleurs.

::callout{type="warning"}
Le mythe, et le contre-test, avec le nom de la source. Pas le mot « Attention » en tête : l'icône suffit.
::

## Comment savoir que c'est cuit

Un test. Pour porc, volaille, haché : la phrase ANSES, avec l'URL.

## Questions fréquentes

### Question prise du SERP ?

Réponse courte.

Vers le [guide des méthodes](/techniques-culinaires/methodes-de-cuisson), puis deux recettes réelles.
````
