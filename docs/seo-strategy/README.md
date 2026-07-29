# SEO strategy — Journal du Cuistot

**Status:** Living document  
**Last updated:** 2026-07-21  
**Site:** [journalducuistot.fr](https://journalducuistot.fr)  
**Locale:** `fr-FR`

This folder captures post–Strapi-migration SEO direction: what we already publish, which queries to target, how we validate ideas, how product features support traffic, and [monetization](./monetization.md) (affiliation focused on **ustensiles**, not ingredients).

## Documents

| Document | Purpose |
|----------|---------|
| [Content inventory](./content-inventory.md) | Strapi/live URLs: CMS pages, blog themes, recipe silos |
| [Keyword validation](./keyword-validation.md) | Nuxt SEO Pro usage, SERP checks, tracked keyword list |
| [Priorities & silos](./priorities-and-silos.md) | Execution order, hub/spoke model, technical SEO checklist |
| [Product ↔ SEO](./product-features-seo.md) | Glossary, allergens, games, AI assist — mapped to search intent |
| [Monetization](./monetization.md) | Ads, affiliation (ustensiles-first), sponsors, legal disclosure |

## Context

- **Public app:** `apps/web` (SSR, `@nuxtjs/seo`, sitemaps, schema.org).
- **CMS:** `apps/cms` (D1, recipes/articles/pages, import from Strapi).
- **Baseline (2026-07-21):** Nuxt SEO Pro reported **no organic rankings/traffic** for `journalducuistot.fr` — treat as greenfield after cutover; connect **Google Search Console** and re-run rankings in SEO Pro once the new stack is live.

## How to maintain

1. After Strapi import, refresh [content inventory](./content-inventory.md) from `/api/sitemap-ia` or CMS exports.
2. Before new hubs, run **SERP** analysis in SEO Pro on the exact French query (see [keyword validation](./keyword-validation.md)).
3. Update [priorities](./priorities-and-silos.md) quarterly from GSC queries and SEO Pro `rankings`.

## Related

- [Architecture overview](../architecture/overview.md)
- [CMS ↔ Strapi schema audit](../architecture/cms-strapi-schema-audit.md)
- [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) — migration and Comark/web cutover
