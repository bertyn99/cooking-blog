# Pages CMS — techniques et code

Relevé `list-pages` du 2026-10-15. **Revérifier les ids** avant un update : ils servent de carte, pas de cache éternel.

Chemin public = slugs des ancêtres + slug. Le slug d'une page déjà créée ne change pas quand on met à jour `name`.

## Déjà en ligne

| Id | Slug | Parent | Rôle pour ce skill |
|---|---|---|---|
| 14 | `techniques-culinaires` | — | Hub. À réécrire : une section par enfant réel. Aujourd'hui c'est un essai d'accueil avec des liens morts `/bases-culinaires/…`. |
| 18 | `methodes-de-cuisson` | 14 | Sous-hub méthodes. Enfants déjà publiés : ne plus écrire « à venir ». |
| 3 | `saisir-viande-parfaitement` | 18 | Méthode. Feuille courte : la compléter, ne pas la dupliquer. |
| 16 | `art-de-rotir-guide-complet` | 18 | Méthode |
| 10 | `guide-friture-maison` | 18 | Méthode (sécurité huile déjà présente) |
| 7 | `secrets-grillade-parfaite` | 18 | Méthode. Aucune température au relevé : en ajouter avec source. |
| 12 | `guide-cuisson-pochee` | 18 | Méthode |
| 9 | `cuisson-vapeur-facile` | 18 | Méthode |
| 17 | `guide-braisage-plats-mijotes` | 18 | Méthode. Titres `## **...**` à nettoyer. |
| 19 | `technique-cuisson-etouffee` | 18 | Méthode. La plus proche du squelette. Liens de fin morts (`/glossaire-culinaire`, `/guide-ustensiles`, `/recettes/…`) à remplacer par des URLs réelles. |
| 4 | `preparation-des-ingredients` | 14 | Déjà du **code** (mise en place). Mettre à jour sur place. Ne pas recréer « La mise en place ». |
| 13 | `techniques-de-decoupes` | 14 | Déjà du **code** (tailles + couteau). Lien `/bases-culinaires` à retirer. |
| 15 | `conservation-aliments` | 14 | Déjà du **code** (froid, durées). La page sécurité s'y relie ; elle ne recopie pas tout le guide. |
| 5 | `les-epices-essentielles-en-cuisine` | 14 | 36 caractères. **Hors skill.** Article ou glossaire. |
| 2 | `les-epices-essentielles-en-cuisine-1` | — | Vide. Doublon. Ne pas remplir. |

Hubs recettes (`recette`, `recettes-du-monde`), accueil, à propos, politique : ne pas les réécrire avec ce skill.

## Cluster code — pas encore créé

Parent prévu : un hub `code-de-la-cuisine`, enfant de l'id 14. Le créer au premier besoin, pas en lot.

| Page | Type | Déjà couvert par |
|---|---|---|
| Le code de la cuisine | Hub | — |
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
