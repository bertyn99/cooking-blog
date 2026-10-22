# Pages CMS — techniques et code

Relevé `list-pages` du 2026-10-16. **Revérifier les ids** avant un update : ils servent de carte, pas de cache éternel.

Chemin public = slugs des ancêtres + slug. Le slug d'une page déjà créée ne change pas quand on met à jour `name`.

## Déjà en ligne

| Id | Slug | Parent | Rôle pour ce skill |
|---|---|---|---|
| 14 | `techniques-culinaires` | — | Hub. Réécrit 2026-10-18 : photo, mermaid, `::grid variant="cards"`. |
| 18 | `methodes-de-cuisson` | 14 | Sous-hub. Réécrit 2026-10-18 : photos, mermaid, cartes par verbe. |
| 3 | `saisir-viande-parfaitement` | 18 | Méthode. Feuille courte. |
| 16 | `art-de-rotir-guide-complet` | 18 | Méthode. H1 poulet rôti au four. |
| 10 | `guide-friture-maison` | 18 | Méthode. Huile ≤ 180 °C DREETS. |
| 7 | `secrets-grillade-parfaite` | 18 | Méthode. Sonde + Versailles / ANSES séparés. |
| 12 | `guide-cuisson-pochee` | 18 | Méthode. H1 poisson. |
| 9 | `cuisson-vapeur-facile` | 18 | Méthode. H1 légumes. |
| 17 | `guide-braisage-plats-mijotes` | 18 | Méthode. Plus de `## **`. |
| 19 | `technique-cuisson-etouffee` | 18 | Méthode. Liens morts retirés. |
| 4 | `preparation-des-ingredients` | 14 | Code (mise en place). Ne pas recréer. |
| 13 | `techniques-de-decoupes` | 14 | Code. Réécrit 2026-10-18 : griffe, grille julienne/bâtonnet/brunoise, cartes. |
| 15 | `conservation-aliments` | 14 | Code (froid ANSES). |
| 5 | `les-epices-essentielles-en-cuisine` | 14 | 36 caractères. **Hors skill.** Article ou glossaire. |
| 2 | `les-epices-essentielles-en-cuisine-1` | — | Vide. Doublon. Ne pas remplir. |

| 21 | `lab-blocs` | — | **Lab interne** (draft, `noindex`). Tous les blocs Comark. Ne pas publier. Preview : `/preview?type=page&slug=lab-blocs`. |

Hubs recettes : `recette` (11), `recettes-du-monde` (1). Accueil (20) : seed `HOME_PAGE_MARKDOWN` (hero / person / hubs). `update-page` MCP déclenche encore `updateAsHome` + `BEGIN` tant que le CMS n’a pas le correctif `switchingHome`.

## Drafts créés 2026-10-16 (ne pas publier)

| Id | Slug | Parent | Requête |
|---|---|---|---|
| 22 | `cuisine-africaine` | 1 | cuisine africaine (1300) |
| 23 | `cuisine-europeenne` | 1 | cuisine italienne (4400) comme coin |
| 24 | `aperitif` | 11 | apéritif (6600) |
| 25 | `pickles-et-legumes-fermentes` | 11 | recette pickles (6600), lactofermentation (2900) |
| 26 | `guide-des-ustensiles` | 14 | cible des anciens `/guide-ustensiles` |
| 27 | `code-de-la-cuisine` | 14 | hub code |

## Cluster code

Hub créé : id **27**, slug `code-de-la-cuisine`, parent 14, **draft**.

| Page | Type | Déjà couvert par |
|---|---|---|
| Le code de la cuisine | Hub | id 27 (draft) |
| Le vocabulaire qui change le geste | Hub | termes dispersés dans les méthodes |
| Tailler | Feuille | id 13 |
| La mise en place | Feuille | id 4 |
| Le code du couteau | Feuille | une section de l'id 13 — n'en faire une page que si la feuille découpe déborde |
| Sel, acide, gras | Hub | — |
| Goûter pour rectifier | Feuille de sel / acide / gras | — |
| Fonds et sauces mères | Hub | — |
| La chaleur | Hub | mythes déjà dans saisir / braiser : lier, ne pas recopier le pas à pas |
| Points de cuisson | Feuille de la chaleur | — |
| Sécurité à la maison | Hub | id 15 pour le froid ; cette page garde les gestes ANSES |
| Habitudes de brigade | Feuille | — |

## Liens morts à ne plus écrire

`/bases-culinaires/…`, `/glossaire-culinaire`, `/guide-ustensiles`, `/recettes/<slug>` (le préfixe vivant est `/recette/<slug>`).
