# Blitz SEO — Apéritif belge (sprint 30 jours)

**Démarré:** 2026-11-14
**Page cible:** `/blog/inspiration-culinaire/10-delicieuses-recettes-de-plat-aperitif-belge-pour-l-ete` (article #16)
**Mot-clé money:** famille `apéritif belge` / `apéro belge` / `recettes apéritif belge`
**Statut:** plan validé, exécution J1 à J30

---

## 1. Pourquoi cette page (et pas une tête à 200 k)

### Le test « ça ferait mal de la perdre »

Mesure GSC documentée (28 j, audit 2026-10) — la seule page du site avec des clics hors marque :

| Page | Clics | Imp. | CTR | Pos |
|---|---|---|---|---|
| **apéritif belge (article #16)** | **4** | **87** | **4,6 %** | **10,1** |
| desserts Afrique du Nord (#9) | 3 | 114 | 2,6 % | 30,5 |
| moules marinières | 0 | 61 | 0 % | 70,8 |
| fricadelles | 0 | 47 | 0 % | 55,7 |
| crevettes grises à la bière | 0 | 25 | 0 % | 62,0 |
| recettes-du-monde (hub) | 0 | 5 | 0 % | 7,4 |

Requêtes : `apero belge` (16 imp) **pos 9,1** · `apéritif belge` (7 imp) pos 15,6.

### Les deux alternatives écartées, avec la preuve

**`boeuf bourguignon` (201 000/mois, diff 6).** Vérifié sur le SERP réel du 14/11 : journaldesfemmes (1 281 avis), cuisineaz, meilleurduchef, régal, Ôdélices — huit domaines d'autorité sur la première page. Un site à 6 clics/mois n'entre pas là en 30 jours. Le volume est réel, la fenêtre ne l'est pas. *(Blitz SEO : ne pas viser un domaine sans autorité sur une tête défendue par des marques.)*

**`recettes-du-monde` (hub, pos 7,4).** Position idéale sur le papier, mais **5 impressions** : Google la classe en brand/navigation, pas sur une requête à demande. Zéro levier à presser.

**L'apéritif belge est le seul endroit où Google a déjà donné la page 1 ET où le site a des clics.** Le sprint ne part pas de zéro : il pousse une page que Google a déjà acceptée.

### Ce que le sprint rapporte vraiment

1. **Direct :** pos 10 → 4 sur 87 imp/mois, CTR 4,6 % → 10-12 % ⇒ **4 → 10-12 clics/mois** (+150-200 %).
2. **Structurel (le vrai gain) :** la page est la seule à porter de l'autorité dans le cluster Belgique/Nord. Elle lie déjà 8 recettes (`moules-marinieres`, `les-fricadelles`, `crevettes-grises-a-la-biere`, `gaufres-salees`, `croquettes-de-fromage`, `bouchees-a-la-reine`, `chicons`, `gratin-endives-jambon`). Ces recettes sont à **pos 55-70**. Une page 1 montée en top 3 leur transmet du jus — c'est le seul chemin réaliste pour sortir le cluster de la page 6.

**Honnêteté sur le plafond :** ~50-100 recherches/mois sur la famille. Ce sprint ne finance pas le site. Il installe une méthode (concentration, preuve, mesure) et débloque le cluster. C'est un investissement de méthode autant que de trafic.

---

## 2. État réel de la page (relevé CMS du 14/11)

**Déjà bon — ne pas toucher :**
- Title front-loadé : *« Apéritif belge : 10 recettes de plats apéritifs faciles »* (53 c)
- Meta description 156 c, keywords propres, `index, follow`
- Mot-clé dans l'URL (`aperitif-belge` ✓) — **pas de changement de slug** (301 inutile)
- Intro : « apéritif belge » ×5, « apéro belge » ×1
- 10 H2 nommés par plat, 8 recettes liées, table des 10 items, lien montant vers le hub
- FAQ en 4 questions (dont 1 avec lien vers le hub)

**Les 5 trous à combler :**

| # | Défaut | Effet |
|---|---|---|
| 1 | FAQ en **gras markdown**, pas en `::faq` | **Aucun `FAQPage` schema** → invisible pour les PAA et les AI Overviews |
| 2 | **Aucun `ItemList` schema** sur les 10 items | Pas d'éligibilité au carrousel / aux listes enrichies |
| 3 | **Zéro lien entrant** depuis les 6 listicles apéro frères (marocain, portugais, espagnol, italien, sud-africain, français) et depuis les 8 recettes belges | La page ne reçoit aucune pression interne — c'est le levier n°1 |
| 4 | `## 2. Les boulettes de viande à la liégeoise` n'a **aucun lien** | Item mort dans une liste dont 9/10 sont cliquables |
| 5 | « c'est une **listicle** vivante » dans l'intro | Slop : mot anglais-jargon, invisible pour un lecteur français, et c'est la 1re phrase |

---

## 3. Checklist on-page (à exécuter par ordre)

### J1 — Snippet et copy
- [ ] **Title** → `Apéritif belge : 10 recettes faciles pour l'apéro` (50 c) — couvre la variante sans accent `apero belge` (celle qui tape le plus) et supprime la répétition « plats apéritifs ».
- [ ] **Meta** → `Apéritif belge : 10 recettes faciles pour l'apéro — croquettes aux crevettes grises, boulets à la liégeoise, fricadelles, tomates aux crevettes.` (≤155 c)
- [ ] **Intro, 1re phrase** → remplacer « c'est une listicle vivante de la Mer du Nord » par « c'est une carte de la Mer du Nord et des bocages ».
- [ ] **H2 n°2** → lier les boulettes à la liégeoise vers `boulettes-a-la-liegeoise` **si la recette existe** ; sinon reformuler l'item en « à retrouver dans notre sélection de plats mijotés » et retirer la promesse implicite.

### J2 — Schema FAQ (le vrai gain SERP)
- [ ] Convertir les 4 questions de `## FAQ` en bloc `::faq{items='[…]'}` → génère `FAQPage`.
  - **Piège connu :** la quote fermante de l'attribut est régulièrement oubliée. Écrire via script, vérifier `::` de fermeture avant push.
  - Apostrophes **typographiques** (`’`) obligatoires dans le JSON de l'attribut — jamais `'`.
- [ ] Vérifier au Rich Results Test après publication.

### J3 — `ItemList` schema (code)
- [ ] `apps/web/app/pages/blog/[category]/[slug].vue` : émettre un `SchemaOrgItemList` avec les 10 positions quand l'article contient `## 1.` … `## 10.` (ou un flag CMS `isListicle`).
- [ ] Bénéficie à **toute la série apéro** (6 autres listicles) et aux futurs listicles (bredele #51, 13 desserts de Provence).

### J4-J8 — Pression interne entrante (le levier 30 jours)
- [ ] **6 listicles apéro frères** : 1 lien contextuel chacun vers l'apéritif belge, dans une phrase de comparaison réelle (« la version belge joue la crevette grise là où le Maroc met le citron confit »). Pas de « voir aussi » en pied de page.
- [ ] **8 recettes belges** : 1 lien retour dans l'`intro` (« cette recette figure dans nos 10 plats apéritifs belges »). Une phrase par recette, jamais deux.
- [ ] **Hub `recettes-du-monde`** : le lien existe déjà ✓ — vérifier qu'il est dans le paragraphe Europe (ancre descriptive, pas « ici »).
- [ ] **Homepage** : si le bloc « populaire » est piloté par le CMS, y faire remonter l'article.

### J9-J12 — Densification sémantique
- [ ] Ajouter 3 questions PAA réellement tapées, en `::faq` : « Combien de bouchées par personne pour un apéro dînatoire ? », « Quelle bière avec un apéritif belge ? », « Peut-on préparer un apéritif belge la veille ? » — **quantités chiffrées** (le pattern qui a fait bouger moules).
- [ ] Ajouter un H2 `## Combien de plats pour un apéritif belge ?` avec la réponse chiffrée en tête de section (par personne : 6-8 bouchées, 3-4 variétés).
- [ ] Vérifier qu'aucune autre page ne cible `apéritif belge` (anti-cannibalisation) — la fricadelle et les moules ciblent leur nom de plat, pas l'apéro.

### J13-J30 — Rituel quotidien (voir §4)

---

## 4. Calendrier 30 jours

**Rituel quotidien (15 min, non négociable)** — 1 case par jour :

- [ ] 1 lien interne neuf ou re-vérifié vers la page cible
- [ ] 1 micro-retouche on-page (une seule, tracée)
- [ ] Re-soumission de l'URL dans GSC (Inspection d'URL → Demander une indexation) — 1×/semaine suffit, pas tous les jours
- [ ] Relevé de position (voir §5)

| Semaine | Objectif | Livrables |
|---|---|---|
| **S1** (J1-J7) | Snippet + schema | Title/meta/copy (J1) · `::faq` (J2) · `ItemList` code (J3) · premiers 3 liens entrants (J4-J7) |
| **S2** (J8-J14) | Pression interne complète | 6 listicles frères + 8 recettes + homepage · densification PAA · 1re mesure de position |
| **S3** (J15-J21) | Autorité et signal externe | 3-5 liens sortants contextuels (pas de spam) : partage communautaire belge/francophone, réponse Reddit r/cuisine si pertinente · retouches selon le SERP concurrent |
| **S4** (J22-J30) | Consolidation + mesure | Aucune nouvelle modification structurelle (laisser Google digérer) · relevé final · décision : continuer / passer au cluster suivant |

**Règle d'arrêt :** si à J21 la position n'a pas bougé de 10,1 vers ≤8, le problème n'est pas on-page — c'est l'autorité du domaine. On arrête le sprint et on bascule sur la production de contenu du cluster (les 8 recettes belges), pas sur plus de retouches.

---

## 5. Journal de suivi

Format à tenir dans ce fichier, une ligne par jour :

```
| Date | Position | Clics | Imp. | CTR | Changement du jour | Note |
```

Amorçage :

| Date | Position | Clics | Imp. | CTR | Changement du jour | Note |
|---|---|---|---|---|---|---|
| 2026-11-14 | 10,1 | 4 | 87 | 4,6 % | Baseline (GSC 28 j, audit 2026-10) | Point de départ |

**Sources de mesure :**
- Position / clics / CTR → GSC (`nuxtseo search analytics keywords --preset striking-distance`)
- Sessions réelles → Umami (page `/blog/inspiration-culinaire/10-…-aperitif-belge…`) — 33 vues/30 j au 14/11, c'est le vrai compteur de trafic du site

---

## 6. Repères de réussite

| Échéance | Position | CTR | Clics/mois | Lecture |
|---|---|---|---|---|
| J14 | ≤ 8 | ≥ 6 % | 6-7 | Le snippet et les liens mordent |
| J21 | ≤ 6 | ≥ 8 % | 8-9 | Google a compris le signal |
| J30 | **≤ 4** | **≥ 10 %** | **10-12** | Objectif atteint |
| J30 (échec) | > 8 | — | < 6 | Déficit d'autorité, pas de contenu → pivot cluster |

**Signal secondaire (le vrai indicateur de santé) :** `moules-marinieres` et `les-fricadelles` doivent gagner ≥ 5 positions sur la même période. Si la page cible monte et que le cluster ne bouge pas, les liens internes ne transmettent pas — vérifier qu'ils sont bien dans le corps de texte et non en pied de page.

---

## 7. Blocage technique à lever (1 commande)

L'accès GSC/keywords du CLI est hors service sur cette machine :

```
KeychainFailure: The OS keychain credential referenced by ~/.nuxtseo/auth.json is missing.
```

Conséquence : **les positions ci-dessus viennent de l'audit 2026-10, pas d'une lecture live**, et les volumes ne peuvent pas être re-gatés (DataForSEO indisponible cette session).

Pour débloquer : `nuxtseo login` (validation navigateur), puis `nuxtseo search analytics keywords --site s_7a49d74f --preset striking-distance --json`. Sans ça, le sprint avance à l'aveugle sur la mesure — ce qui est exactement ce que Blitz SEO interdit.
