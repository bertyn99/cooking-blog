# jdc-article-writer

Write and publish SEO-optimized French food articles for **Journal du Cuistot** in Bertyn Boulikou's voice.

## Auto-trigger keywords

écrire un article jdc, article journal du cuistot, rédiger un article de cuisine, listicle apéritif, tout savoir sur [ingrédient], histoire d'un plat, origine recette, guide ustensiles, comparatif poêle, j'ai testé livre de cuisine, street food article, recherche de mots-clés cuisine, mot-clé food français, analyse SERP recette, créer un brouillon article CMS, jdc-cms article, apéritif [pays] recettes, cuisine africaine article, épices article, marinades, technique culinaire article, FAQ recette, maillage interne article, meta description article cuisine

## What it covers

- **Keyword research**: `nuxtseo` CLI (`research keywords`, SERP fallback) + Search Console MCP (`analytics_query` on the jdc property)
- **Competitor analysis**: top-2 SERP pages → intent contract + differentiation gap
- **8 article templates**: listicle pays/apéro, ingrédient histoire & origine, cuisine & culture, ustensile/matériel (affiliation), livre de cuisine testé, street food/voyage, technique/astuces, saisonnel
- **Voice**: Bertyn Boulikou — young passionate cook, food history and discovery, first person, anti-AI-slop rules (banned openers from real audit findings)
- **On-page SEO**: title/meta/slug/excerpt spec, FAQ from PAA, internal links from the live CMS inventory, schema notes
- **Publishing**: jdc-cms MCP draft workflow (`create-article` → `upsert-seo` → previewUrl → human publishes)

## References

- `references/templates.md` — per-type skeletons and differentiation levers
- [SEO strategy docs](../../../docs/seo-strategy/) — keyword validation, priorities & silos, monetization, audits
