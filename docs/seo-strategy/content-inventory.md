# Content inventory (Strapi → CMS import)

**Source:** Live sitemap index at `https://journalducuistot.fr/api/sitemap-ia` (snapshot 2026-07-21).  
**Refresh:** Re-fetch after import or when new pages ship from `apps/cms`.

## Summary

| Silo | Type | Count (snapshot) | SEO role |
|------|------|------------------|----------|
| Techniques culinaires | CMS pages (hierarchical) | 15+ URLs under `/techniques-culinaires/**` | Evergreen pedagogy, long-tail “comment…” |
| Recettes | Listing + category hub | `/recette`, `/recette/recettes-du-monde` | Conversion, Recipe schema |
| Blog | Articles by category | 30+ URLs (growing) | Listicles, ingredients, travel, gear |
| Trust | CMS pages | `/a-propos`, `/politique-de-confidentialite` | E-E-A-T |

---

## CMS pages (19 URLs)

### Recettes hubs

| Path | Notes |
|------|--------|
| `/recette` | Recipe listing |
| `/recette/recettes-du-monde` | **World recipes hub** — should become a real taxonomy landing page post-migration |

### Techniques culinaires (pillar)

| Path | Topic |
|------|--------|
| `/techniques-culinaires` | Pillar hub |
| `/techniques-culinaires/preparation-des-ingredients` | Prep |
| `/techniques-culinaires/techniques-de-decoupes` | Knife / cuts |
| `/techniques-culinaires/conservation-aliments` | Storage |
| `/techniques-culinaires/les-epices-essentielles-en-cuisine` | Spices (in silo) |
| `/les-epices-essentielles-en-cuisine-1` | **Duplicate topic** — canonicalize or 301 on import |

### Méthodes de cuisson (cluster)

| Path | SERP-aligned angle |
|------|---------------------|
| `/techniques-culinaires/methodes-de-cuisson` | Sub-hub |
| `.../saisir-viande-parfaitement` | `comment saisir une viande` |
| `.../secrets-grillade-parfaite` | Grill / BBQ |
| `.../cuisson-vapeur-facile` | Steaming |
| `.../guide-friture-maison` | Frying |
| `.../guide-cuisson-pochee` | Poaching |
| `.../art-de-rotir-guide-complet` | Roasting |
| `.../guide-braisage-plats-mijotes` | Braising |
| `.../technique-cuisson-etouffee` | Stewing / étouffée |

### Trust & legal

| Path | Role |
|------|------|
| `/a-propos` | Author / site story (E-E-A-T) |
| `/politique-de-confidentialite` | Legal |

---

## Blog themes (from sitemap-ia sample)

Categories appear in URL paths as `/blog/{category}/{slug}`.

| Category slug | Editorial pattern | Examples |
|---------------|-------------------|----------|
| `inspiration-culinaire` | “10 recettes d’apéritif [pays] pour l’été” | FR, IT, ES, MA, BE, ZA, … |
| `cuisine-sante` | “Tout savoir sur [ingrédient/épice]” | curcuma, curry, coriandre, clou de girofle, patate douce, igname |
| `materiels-ustensils` | Gear guides for beginners | poêles, fonte, indispensables |
| `astuces-de-cuisine` | How-to tips | épices/herbes, marinades grillades |
| `guides-gourmands` | Travel + food | street food Londres, yakitori Paris |
| `gastronomie-culture` | Culture + recipes | nuoc-mâm, sauces asiatiques, street food maison |
| `uncategorized` | Legacy | e.g. sauces asiatiques — re-categorize on import |

## Recipes

Recipe URLs live under `/recette/{slug}` (see `recipes` group in sitemap-ia). They should link **up** to:

- Technique pages (method used)
- Ingredient / glossary pages (when added)
- `/recette/recettes-du-monde` and recipe categories

## Import / CMS notes

- Strapi **pages** store body as markdown after extract (no dynamic zones in D1). See [ADR-005](../architecture/adr-005-page-content-markdown-not-dynamic-zones.md).
- Preserve **parent hierarchy** for nested CMS URLs (`parent_id` in CMS).
- Fix **article category FK** to `category_articles` before relying on blog URL structure in production. See [schema audit](../architecture/cms-strapi-schema-audit.md).

## Post-import hygiene

- [ ] One canonical URL for “épices essentielles” (remove duplicate slug).
- [ ] Map each technique leaf to 3–5 internal recipe links.
- [ ] Re-home `uncategorized` articles.
- [ ] Regenerate this table from CMS or sitemap-ia.
