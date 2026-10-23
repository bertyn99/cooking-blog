---
name: jdc-pinterest
description: >
  Pipeline Pinterest pour Journal du Cuistot : quand un article ou une recette
  est publié, des pins frais (couverture + images du corps) sont programmés et
  créés via l'API Pinterest v5 avec titre/description optimisés mots-clés.
  Use when: the user mentions "Pinterest", "pins", "épingler", wants to pin
  published content, check pin status, backfill old content, or set up the
  Pinterest token/board. Encodes the Pinterest rules (2:3, 72h same-URL
  spacing, 3–10 pins/day, keyword-led copy, Pin→Board→Page).
---

# jdc-pinterest — Pipeline Pinterest du JDC

## Ce que fait la pipeline (déjà branché)

1. **Publish** (manuel ou planifié) → `publishing-service` insère des lignes
   `pinterest_pins` (`status=pending`) : la couverture d'abord, puis les images
   du corps markdown, espacées de **72h** (règle same-URL), **max 5 pins** par
   contenu. Idempotent (index unique).
2. **Drain** : la tâche Nitro `pinterest-publish-due` (CRON 2×/h en prod)
   crée les pins dus via l'**API Pinterest v5** — titre/description générés par
   Workers AI (français, format Pinterest SEO), image servie en **2:3
   (1000×1500)** par le pipeline d'images du site, lien = page publique exacte.
3. **Cadence** : plafond **8 pins/jour** (bande 3–10/jour du playbook).

## Les règles Pinterest encodées (ne pas violer)

- Pinterest = **moteur de recherche visuel** : mots-clés > followers ; pins
  evergreen (~4 mois de vie) ; traction réelle après **3–6 mois**.
- **2:3 (1000×1500)** obligatoire — les autres ratios sont pénalisés.
- **Pins frais uniquement** (jamais de repin) ; **≥72h** entre deux pins vers
  la même URL ; **3–5 pins distincts** max par destination.
- **Titre** : `[Mot-clé | Bénéfice | Contexte]` ≤ 100 car., mot-clé en premier.
- **Description** : 100–200 car., français naturel, zéro hashtag, zéro stuffing.
- **Pin → Board → Page** : le board doit matcher la catégorie du contenu.
- Lien = la page de l'article/recette (jamais la home).
- Saisonnalité : prévoir 45–90 jours avant le moment (à venir — pas automatisé).

## Commandes agent

Base : l'admin API du CMS (`NUXT_PUBLIC_CMS_BASE_URL`, défaut
`http://localhost:3001` en dev). Auth : session admin (voir jdc-cms) ou clé
API admin.

```bash
# Statut (configuré ?, compteurs, 25 dernières lignes)
curl -s "$CMS/api/admin/pinterest" -H "Authorization: Bearer $CMS_API_KEY"

# Backfill — met en file TOUT le contenu publié sans pins
curl -s -X POST "$CMS/api/admin/pinterest/sync" -H "Authorization: Bearer $CMS_API_KEY"

# Drain manuel (dév, sans attendre le cron) — réponse {result}
curl -s -X POST "$CMS/_nitro/tasks/pinterest-publish-due"
```

Agent flow typique :
1. `GET /api/admin/pinterest` → si `configured: false`, arrêter et faire le setup.
2. `POST /api/admin/pinterest/sync` → compter les lignes en file.
3. Attendre le drain (ou déclencher la tâche en dev) puis re-vérifier le statut.
4. Erreurs fréquentes : `pinterest_403` = token expiré/scopes manquants ;
   `content_unpublished` = contenu dépublié depuis (ligne abandonnée, normal) ;
   `public_path_unresolved` = slug/manque catégorie.

## Setup Pinterest (une fois, humain)

1. Convertir le compte en **business** : pinterest.com → Paramètres → Convertir.
2. **developers.pinterest.com** → Create app (`journalducuistot`) → noter App ID.
3. OAuth user token, scopes requis : `boards:read`, `pins:write`
   (https://developers.pinterest.com/docs/getting-started/authentication/ —
   flow OAuth ou le Playground "Generate token" le plus simple).
4. Créer les **boards par catégorie** du site (`Cuisine santé`,
   `Inspiration culinaire`, `Astuces de cuisine`, `Recettes`…) — Pin→Board→Page.
5. Récupérer les board ids : `GET https://api.pinterest.com/v5/boards`
   (Bearer token).
6. Poser les secrets :
   - GitHub (`gh secret set`) : `PINTEREST_ACCESS_TOKEN`,
     `PINTEREST_BOARD_ID` (board par défaut),
     `PINTEREST_BOARDS` (JSON `{"cuisine-sante":"<id>","*":"<id>"}`).
   - Local `.env` : `PINTEREST_ACCESS_TOKEN=…` (+ les deux autres si test local).

Sans token configuré, la pipeline est **inerte** : les lignes `pending`
s'accumulent sans jamais appeler l'API (`configured: false` l'indique).

## Fichiers

| Fichier | Rôle |
|---|---|
| `apps/cms/server/db/schema/pinterest-pins.ts` | table + index uniques |
| `apps/cms/server/db/queries/pinterest.ts` | enqueue / dueRows / markPinned |
| `apps/cms/server/utils/pinterest.ts` | client API v5, config, 2:3 URL, prompts |
| `apps/cms/server/services/pinterest-service.ts` | enqueue/processDue/backfill |
| `apps/cms/server/services/publishing-service.ts` | hook au publish |
| `apps/cms/server/tasks/pinterest-publish-due.ts` | drain CRON 2×/h |
| `apps/cms/server/api/admin/pinterest/*` | statut + sync (admin) |
