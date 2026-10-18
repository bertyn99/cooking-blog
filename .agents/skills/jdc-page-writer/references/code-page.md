# Squelette — page code

Une page code est une décision que le cuisinier reprend sur plusieurs méthodes. La première ligne des notes de travail dit : `type: code`.

Si le brouillon gagne un minuteur et des étapes de plat, ce passage part sur une recette ou sur la feuille méthode qui existe déjà (`page-map.md`).

## Étiquette obligatoire

Chaque chiffre est étiqueté dans la phrase :

- **ANSES / ministère** — consigne publique française.
- **École / Escoffier / test de cuisine** — convention de métier ou mesure d'un auteur.

Les degrés de goût et les degrés de sécurité ne partagent pas une ligne sans cette étiquette. Ne pas importer un tableau canadien ou USDA (63 / 71 / 74 °C) comme une règle française.

## Cluster

Le hub `code-de-la-cuisine` est enfant de `techniques-culinaires`. Feuilles déjà couvertes : ne pas les recréer (`page-map.md`).

| Page | Job |
|---|---|
| Le code de la cuisine | Hub. Ce qu'on décide avant la poêle : mots, plan de travail, assaisonnement, chaleur, sécurité. Dit ce qui est officiel et ce qui est une habitude de métier. |
| Le vocabulaire qui change le geste | Hub court. Un mot = le geste, puis le lien vers la méthode qui existe. Mouiller, réduire, déglacer, ciseler, napper, singer. Pas un glossaire de 150 entrées. |
| Tailler | Pourquoi la coupe existe (temps de cuisson, garniture ou morceau qu'on mange). Les tailles d'école bougent d'un millimètre : le dire. |
| La mise en place | Tout pesé et séparé avant le feu. Version maison du poste de CAP. |
| Le code du couteau | Prise, griffe, lame affûtée, planche stable. Deux planches : la phrase ANSES, pas un code couleur de restaurant. |
| Sel, acide, gras | Comment rectifier un plat qui existe déjà. Pas de recette. Le sel fait ressortir le goût de l'aliment. L'acide relève une sauce plate. Le gras porte l'arôme. Si le liquide réduit, saler peu au début. |
| Goûter pour rectifier | Cuillère propre (ministère). D'abord le sel, ensuite l'acide. Une farce crue : cuire une cuillère à café avant de corriger la masse. |
| Fonds et sauces mères | Dire quelle liste. Dans le *Guide culinaire*, les grandes sauces de base nommées ensemble sont espagnole, velouté, béchamel, tomate. La liste « cinq mères avec hollandaise » est l'enseignement anglais plus tardif. La mayonnaise est la mère des sauces froides chez Escoffier. Pas les recettes complètes : le principe, puis le lien. |
| La chaleur | Transfert, brunissement, repos. La saisie ne ferme pas la viande. Le repos n'est pas « le jus qui rentre ». Lien vers saisir et braiser pour le geste. |
| Points de cuisson | Bleu, saignant, à point, bien cuit : langue de texture pour une viande rouge entière. Les tables d'école ne s'accordent pas (Versailles et Socopa divergent). L'écrire. Ce n'est pas une autorisation sanitaire. |
| Sécurité à la maison | Seulement ANSES et le ministère de l'Agriculture. |
| Habitudes de brigade | Une personne, un plan de travail : débarrasser en avançant, le cru ne croise pas le cuit. Pas d'organigramme de brigade. |

## Sécurité — phrases à ne pas arrondir

Vérifier la page ANSES le jour de l'écriture. Au relevé d'octobre 2026 :

- **Salmonella** ([ANSES](https://www.anses.fr/fr/content/quest-ce-que-la-salmonellose-et-comment-sen-premunir)) : cuire à cœur à **70 °C** les aliments d'origine animale, en particulier porc, volaille et viande hachée. Personnes à risque : pas d'œuf cru ou peu cuit. Ne pas laver les œufs. Préparation à l'œuf cru : tout de suite, ou au froid dans les 24 h.
- **Trichinella** ([ANSES](https://www.anses.fr/fr/content/la-trichinellose)) : viande non contrôlée, notamment sanglier, **71 °C** à cœur. Le congélateur maison ne suffit pas. Ne pas fusionner 70 et 71.
- **Froid** ([chaîne du froid](https://www.anses.fr/fr/article/comment-bien-conserver-ses-aliments-ne-pas-interrompre-chaine-du-froid), [dix gestes](https://www.anses.fr/fr/content/conseils-dhygiene-dans-la-cuisine-dix-gestes-simples-pour-prevenir-les-risques)) : zone la plus froide du frigo à **4 °C**. Pas plus de **2 heures** à température ambiante avant de refrigérer. Congélateur **−18 °C** : ça arrête la croissance, ça ne tue pas. Ne pas recongeler un produit décongelé.
- **Viande hachée bien cuite** pour les jeunes enfants, les femmes enceintes et les personnes immunodéprimées : la page « dix gestes » le dit sans donner un degré. Le ministère ajoute des repères visuels (pas de rose à la coupe pour le haché des moins de 15 ans ; volaille cuite à l'os). Ne pas écrire « la loi française impose une sonde ». L'avis ANSES 2012-SA-0005 discute 71 °C pour les steaks hachés des jeunes enfants et n'a pas retenu une obligation de thermomètre pour le public.
- **Deux planches** : une pour cru viande et poisson, une pour cuit et légumes propres ([geste 4](https://www.anses.fr/fr/content/conseils-dhygiene-dans-la-cuisine-dix-gestes-simples-pour-prevenir-les-risques)).

## Ce qui ne va pas sur ces pages

- Symptômes, régimes, « l'acide équilibre le pH », detox.
- HACCP de restaurant : PMS, dosages de désinfectant, vestiaires, organigramme.
- Biographie d'Escoffier, qui a inventé la béchamel, bloc pâtisserie du CAP.
- La recette des sauces mères ou le pas à pas du braisage.
- Un seul « température sûre » qui mélange 52 °C et 70 °C.
- Laver les œufs, le congélateur qui tue la trichine, le pouce qui remplace une sonde, présentés comme des règles.

## Forme

```markdown
# Sel, acide, gras

La décision, en deux phrases. Pas l'histoire du sel.

## Saler pour que ça ait le goût de soi

## L'acide quand c'est plat

## Le gras qui porte

::callout{type="info"}
Ce qui est une habitude de cuisine, nommé comme telle. Pas le mot « Info » en tête.
::

Un `::table` dès que goût et sécurité se croisent (colonnes : repère, degré, source). Syntaxe dans `page-blocks.md`. Pas de tableau markdown en pipes.

::faq{items='[{"question":"Question prise de la requête ?","answer":"Réponse courte, sans apostrophe ASCII."}]'}
#title
Questions fréquentes
::

Lien vers le hub code, et vers la méthode qui s'en sert (saisir, braiser), pas vers une recette inventée.
```
