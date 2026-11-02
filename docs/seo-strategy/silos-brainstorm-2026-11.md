# Brainstorm silos — 2026-11

**Contexte:** arbre d'URLs stabilisé le 30/10 (301 canonicals déployés), 98 recettes au CMS (66 publiées), hub monde refait + 5 sous-hubs programmés (nov), JSON-LD corrigé. Le frein « pas de recherche de keywords avant arbre stable » est levé — gate DataForSEO du 31/10 inclus ci-dessous.
**Source:** [priorities-and-silos](./priorities-and-silos.md) + [audit 2026-10](./audit/seo-audit-2026-10.md) + [keyword-validation](./keyword-validation.md) + GSC.

---

## 1. Le mécanisme : niche → sous-hub → tête

Chaque silo fonctionne comme une **carte topique** en 3 étages :

```
Étage 3 — NICHES (recettes individuelles)      s'indexent en semaines (diff 0–11)
    │  internal links ↓↑
Étage 2 — SOUS-HUB / catégorie                 rank sur les moyennes (440–4 400/mois)
    │
Étage 1 — HUB de silo                          rank sur la TÊTE (18 100+ /mois)
```

- **Les niches rapportent les premières impressions** et prouvent le cluster à Google.
- **Le sous-hub agrège** les niches : c'est lui qui rank sur la requête moyenne (« sauce pour pâtes » 4 400).
- **Le hub ne gagne la tête** (« recette pâtes » 18 100) que si ≥ 8–12 pages niche maillées existent — et une fois gagnée, elle renvoie crawl + autorité aux niches.

**Preuve interne** : le hub recettes-du-monde rankait **pos 7.4 sur un stub** (brand-ish) — refait avec 534 mots + FAQ + table le 30/10. À l'inverse, **15 recettes de pâtes publiées = 0 impression** (audit §1.1) : orphelines, sans hub, sans maillage — les pages isolées ne rankent pas.

---

## 2. Les 7 silos — niches, têtes, état

Gate DataForSEO (31/10, FR) : `recette pates` **18 100** · `sauce pour pates` **4 400** · `legumes fermentes` **170** (diff 0) · `cuisine africaine recette` **70** (diff 0) · `ustensiles cuisine indispensables` **90** (diff 0).

| # | Silo | Niches (gagnées / en cours) | Sous-hub | Tête cible (vol) | État au 31/10 | Manques |
|---|------|------------------------------|----------|------------------|---------------|---------|
| 1 | **Monde (pays)** | thiéboudienne 4 400/diff 2, yassa 2 400, bissap, apéritif marocain, desserts Afrique du Nord | hub monde ✓ + 5 sous-hubs **programmés nov** (africaine, asiatique, européenne, apéritif, pickles) | `recettes du monde` — pos **7.4** | **Le plus avancé** | Thiébo live le 16/12 ; sous-hubs live 1–11 nov ; après : hub par pays (Portugal ?) |
| 2 | **Pâtes italiennes** 🆕 | 15 recettes publiées (alfredo 4 400 en cousine, gnocchi tomate 1 300, bolognaise…) | **AUCUN** — c'est le trou | `recette pates` **18 100** + `sauce pour pates` **4 400** | 15 pages **orphelines à 0 impression** (audit §1.1) | Créer le hub + lier les 15 recettes vers lui |
| 3 | **Techniques** | « comment saisir », cuisson vapeur, friture (pos 10), braiser… | hub + 8 méthodes ✓ (H1 nettoyés 30/10) | `techniques culinaires` — branding (Wikipedia l'a) | Pages saines | FAQ + FAQPage sur les 8 méthodes ; liens recettes → techniques ; restructure conservation |
| 4 | **Apéro par pays** | apéritif belge (pos 9, CTR 4,6 %), marocain, portugais | sous-hub apéritif (11 nov) | `recette apéritif` — dur (carousel) | 7 listicles + 8 recettes, maillage fait (§2.6 ✓) | `ItemList` schema sur les listicles ; décliner par contrainte (budget, végé) |
| 5 | **Fermentation & conservation** 🆕 | kimchi maison, « légumes fermentés » 170 | sous-hub pickles (11 nov) | `méthodes de conservation des aliments` (95 imp, pos 89.5) | 2 pages maillées | **Restructurer conservation** (audit §2.4 : 4 H2, keywords junk) + FAQ + maillage pickles↔kimchi↔conservation |
| 6 | **Ingrédients / tout-savoir** | curcuma en cuisine, cumin, coriandre, girofle, igname, gombo, masala, basmati (10 articles) | aucun (glossaire = Phase 3) | `épices indispensables cuisine` — snippet à prendre | 10 articles, **presque aucun lien vers les recettes** qui les utilisent | Lier article ↔ recette (nuoc-mâm ↔ pad thaï…) ; glossaire MVP ; reframing « cuisine » ✓ fait sur plusieurs |
| 7 | **Matériel 💰** | ustensiles indispensables 90, poêle fonte, friture (pos 10) | aucun hub | tête possédée par retailers | 5–6 articles | Comparatifs + affiliation (monetization #1) — **P2, quand l'autorité monte** |

---

## 3. Ce que le ladder rapporte, silo par silo

**Monde (silos 1)** : le hub pos 7.4 pousse déjà les sous-hubs publiés en novembre ; les niches Afrique (4 400 + 2 400 + apéro pays) ramènent les premières milliers d'impressions si elles tiennent le top 10. Sous-hubs = agrégateurs (« cuisine africaine » 70/mois, faible en volume mais intention parfaite et concurrence nulle).

**Pâtes (silos 2, le move n°1)** : 15 recettes existent, la tête fait 18 100/mois et la niche « sauce pour pâtes » 4 400 — tout le contenu est là, il manque **une page d'agrégation + le maillage**. Coût : une CMS page « Recettes de pâtes » (`::recipe-list` avec les 15 slugs + contenu écrit sauces/formes + lien article #33) + une ligne d'intro par recette vers le hub. Le ladder espéré : niches (alfredo, gnocchi…) → hub pâtes → « recette pâtes ».

**Techniques (silos 3)** : le sous-hub méthodes est « surfaced, too thin to rank leaves » (audit) — FAQ + liens depuis les recettes qui utilisent chaque méthode (yassa → étouffée ? non, mais bourguignon → braiser, moules → cuisson pochée…) complètent la carte.

**Fermentation (silos 5)** : petit volume mais concurrence nulle (diff 0) et synergie produit (bocaux = affiliation secondaire). Kimchi → pickles → conservation : 3 pages, une seule technique mère.

---

## 4. Priorisation (impact × effort)

| P | Action | Effort | Impact attendu |
|---|--------|--------|----------------|
| **P0** | **Moules marinières : FAQ quantités + FAQPage** (audit §2.3 — cluster `combien de moules par personne` ×11 variantes, pos 61–79) | 30 min | Top 10 sur le cluster, premières clics |
| **P0** | **Hub Recettes de pâtes** (CMS page, `::recipe-list` 15 slugs, contenu sauces/formes, lien article #33) + 1 ligne par recette vers le hub | 1 h | 15 pages orphelines deviennent un cluster ; tête 18 100 en ligne de mire |
| **P1** | **Restructure conservation-aliments** (§2.4 : H2 par méthode + FAQ + keywords) + maillage pickles↔kimchi↔conservation | 1 h | 95 imp pos 89.5 → top 20 |
| **P1** | **8 pages méthodes : FAQ + FAQPage + liens recettes→techniques** | 2 h | Long-tail « comment… » ; Phase 2 soldée |
| **P2** | Ingrédients : lier les 10 articles → recettes qui utilisent l'ingrédient | 2 h | Phase 3 sans glossaire |
| **P2** | Matériel : 1 comparatif test (poêles/friture) + affiliation ustensiles | 3 h | Premier revenue |
| P3 | Hub par pays apéro (Phase 3), glossaire MVP | — | Après les P0/P1 |

---

## 5. Ce qu'on ne fait pas (inchangé)

- Viser la tête `techniques culinaires` seule (Wikipedia) — branding only.
- Head `recette apéritif été` seul (carousel + nationaux) — l'angle pays est le différenciateur.
- Positionnement « bienfaits santé » sur les ingrédients — reframe cuisine (fait sur les articles récents).
- Programmatic thin (milliers d'URLs auto) — quality gates d'abord.

---

## 6. Métriques de suivi

| Métrique | Cible | Échéance |
|----------|-------|----------|
| `apero belge` pos ≤ 5 + CTR > 5 % | GSC | mi-nov |
| Cluster moules : impressions → clics | GSC | mi-nov |
| Hub pâtes : indexation + premières impressions | GSC | déc |
| Thiéboudienne pos < 20 après publication 16/12 | GSC | janv |
| Impressions mensuelles ≥ 3–5 K (bande « Phase 1–2 executed » du README) | GSC | déc-janv |
