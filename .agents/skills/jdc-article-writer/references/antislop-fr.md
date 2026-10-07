# Anti-slop FR — liste noire et remplacements

Ce qui rend un texte français instantanément reconnaissable comme IA. D'après : The Conversation (Mercanti-Guérin 2026), Pangram (listes de fréquence FR), dubasque.org, gpt-watermark-remover.fr, « 40 patterns » (LinkedIn), websentinel.fr — URLs en fin de page.

## Le mécanisme (pourquoi, pas quoi)

1. Un LLM choisit le mot **le plus attendu** → convergence vers le consensus, perte des irrégularités humaines.
2. Le RLHF récompense le poli et structuré ; les corpus web sont saturés de marketing → « la grammaire d'un éditorial du Monde et la chaleur d'un communiqué de la Commission européenne ».
3. Beaucoup d'IA raisonnent en anglais puis traduisent → calques : *plonger dans* (delve), *crucial*, *mettre en lumière* (shed light on), *défi* (challenge).

On ne combat pas ça en synonymisant mot à mot : on casse la **régularité structurelle** ET le **vocabulaire consensus**.

## 1. Ouvertures bannies

- « À l'ère du numérique » / « Dans un monde en constante évolution » / « De nos jours »
- « Plongeons dans… » / « Plongeons au cœur de… » (calque de *delve into*)
- « Découvrons ensemble » / « Découvrez la magie de… »
- « Bienvenue dans le merveilleux monde de… »
- « Vous êtes-vous déjà demandé… » / « Êtes-vous frustré par… »
- « Dans cet article, nous allons explorer / vous présenter… »
- « Plus que jamais », « Il est indéniable que », « Il ne fait aucun doute que »
- « Que vous soyez X ou Y… »

**Remplacement :** moment concret, fait précis ou aveu. (« La première fois que j'ai goûté un gombo, je n'ai pas compris l'engouement. Puis j'ai appris à le cuire. »)

## 2. Transitions bannies

- Connecteurs empilés : en outre · de plus · par ailleurs · néanmoins · toutefois · ainsi · dès lors · d'autre part · à cet égard · cela étant dit
- Préambules : il convient de noter que · il est important de souligner que · il est essentiel de comprendre que · force est de constater que
- Registre administratif : en ce qui concerne · dans le cadre de · afin de (→ *pour*) · ledit · susmentionné

**Test :** supprimez le connecteur — si la phrase tient, il ne servait à rien.

## 3. Conclusions bannies

- « En conclusion » / « En somme » / « En définitive » / « Au final » / « Dans l'ensemble »
- « N'oublions pas que… » (ton de cours magistral)
- La chute « juste équilibre » : sur tout sujet controversé, conclure en appelant à « concilier les deux approches » = paraître nuancé sans prendre position
- CTA mou « N'hésitez pas à… »

**Remplacement :** conclusion courte, opinionée, sans résumé. Finit sur un détail, une recommandation ou « la prochaine fois, je… ».

## 4. Adjectifs et mots galvaudés

**Général :** crucial · essentiel · fondamental · primordial · incontournable · indispensable · indéniable · remarquable · fascinant · captivant · véritable · authentique · intemporel · robuste · holistique · optimal · structurant · révolutionner · défi · incarner · mettre en lumière · jouer un rôle clé · naviguer (figuré) · quête · voyage (figuré) · tapisserie · kaléidoscope · riche · subtilités · sans faille

**Culinaire (constat éditorial JDC) :** délicieux · savoureux · exquis · alléchant · authentique · généreux · réconfortant (en remplissage) · riche en saveurs · explosion de saveurs · symphonie/harmonie de saveurs · un délice pour les papilles · véritable voyage culinaire · au cœur de la cuisine X · traditions séculaires · trésor de la gastronomie · mariage parfait · sublimer les saveurs · épouser/tisser des saveurs · aux mille vertus · « la magie de »

**Le tell n'est pas le mot isolé, c'est la densité :** trois de ces adjectifs dans un paragraphe sans une seule donnée concrète (température, texture, dose, nom propre) = signature IA.

## 5. Structures et ponctuation

| Pattern | Remplacement |
|---|---|
| **Triade systématique** (« simple, rapide et délicieux ») | Deux, quatre, ou un seul item. Si trois : ne pas les paralléliser. |
| **« Non seulement X, mais aussi Y »** / « Ce n'est pas X, c'est Y » | Phrase directe. « Cette poêle va au four. » |
| **Question rhétorique d'ouverture** | Anecdote ou fait. |
| **Tiret cadratin systématique** (max 1 / 500 mots) | Virgule, deux-points, parenthèses. |
| **Participe présent final** (« …, soulignant son importance ») | Couper — la phrase se suffisait. |
| **Périphrases de prestige** (« s'impose comme », « fait figure de », « constitue un ») | *Est*. |
| **Fausse précision** (« Les experts s'accordent à dire… ») | Nommer la source, ou opinion assumée. |
| **Formules de chatbot** (« Bien sûr ! », « Voici un aperçu de… ») | Supprimer. |

## 6. Rythmes qui trahissent

1. Paragraphes et phrases de longueur identique (test : lecture à voix haute)
2. Intro qui annonce + conclusion qui résume tout (l'humain déborde)
3. Grammaire trop parfaite : jamais de fragment, de phrase commençant par « Mais », de parenthèse
4. Listes à puces en excès (max 2 par 500 mots, le reste en prose)
5. Anaphores mécaniques (chaque paragraphe démarre sur le même gabarit)
6. Gabarit identique par item de listicle — varier : 2 phrases ici, 6 là, une phrase seule pour l'item évident
7. Énumération toujours achevée (« Premièrement… Enfin ») — l'humain abandonne sa liste en route
8. Avalanche de phrases courtes une par ligne (style LinkedIn généré)
9. Hedging seesaw : chaque affirmation suivie d'une contre-nuance, aucune position tranchée
10. Absence de noms propres et de chiffres précis (les prénoms IA : Emily, Sarah ; les chiffres : « plusieurs », « de nombreux »)

## 7. Remplacements concrets (réflexe « carnet de cuisine »)

- **Adjectifs → données sensorielles :** « délicieux » → « le sucre craque, l'intérieur coule encore ; sortez-le à 11 minutes, pas 13. »
- **Évaluations adossées à un fait :** température, texture, son, dose, durée, prix.
- **Chiffres : précis ou silence.** « Trois chefs m'ont dit » ou rien.
- **Sources : nommées** (« dans le *Cuisinier durand*, 1830 ») ou opinion assumée.
- **Irrégularité volontaire :** une phrase d'un mot, puis six. Un paragraphe de deux lignes, puis de cinq.
- **L'empreinte unique :** au moins un détail que seule l'expérience produit — ce qui a raté, ce que le vendeur du marché a dit, ce que ça coûte.

## 8. Checklist avant publication (10 points)

- [ ] Aucune ouverture « monde / ère / plongeons / découvrons »
- [ ] Zéro « il convient de / il est important de / force est de »
- [ ] Conclusion < 4 lignes, sans « en conclusion », avec une opinion
- [ ] ≤ 1 adjectif évaluatif nu par paragraphe, adossé à un fait
- [ ] Pas de triade systématique
- [ ] ≤ 1 tiret cadratin par 500 mots
- [ ] Zéro « non seulement… mais aussi »
- [ ] Longueurs de paragraphes visiblement différentes
- [ ] ≥ 1 nom propre réel + ≥ 1 chiffre précis
- [ ] Lecture à voix haute : aucune phrase qu'on ne dirait pas à table

## Sources

- [The Conversation — Comment « dé-IA-iser » nos écrits](https://theconversation.com/comment-de-ia-iser-nos-ecrits-pour-eviter-la-disparition-des-particularites-des-langues-281811)
- [dubasque.org — Les mots qui trahissent l'IA générative](https://dubasque.org/les-mots-qui-trahissent-lintelligence-artificielle-ia-generative-plaidoyer-pour-une-vigilance-lexicale/)
- [Pangram — Guide pour repérer les schémas IA](https://www.pangram.com/fr/blog/comprehensive-guide-to-spotting-ai-writing-patterns)
- [gpt-watermark-remover — Mots typiques de l'IA à éviter](https://gpt-watermark-remover.com/fr/blog/mots-typiques-ia-eviter)
- [LinkedIn — 40 patterns qui trahissent un texte IA](https://fr.linkedin.com/pulse/40-patterns-qui-trahissent-un-texte-ia-et-le-prompt-system-ducarme-klqdf)
- [websentinel.fr — Articles IA sans sonner IA](https://websentinel.fr/blog/generer-articles-blog-ia-sans-sonner-ia)
- [GitHub — anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing)
