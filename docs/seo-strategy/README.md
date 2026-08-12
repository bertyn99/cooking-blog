# SEO strategy — Journal du Cuistot

**Status:** Living document  
**Last updated:** 2026-08-12  
**Site:** [journalducuistot.fr](https://journalducuistot.fr)  
**Locale:** `fr-FR`

This folder captures post–Strapi-migration SEO direction: what we already publish, which queries to target, how we validate ideas, how product features support traffic, and [monetization](./monetization.md) (affiliation focused on **ustensiles**, not ingredients).

## Documents

| Document | Purpose |
|----------|---------|
| [SEO audit (2026-08)](./seo-audit-2026-08.md) | Deep GSC + technical audit: performance, quick wins, defense, action plan |
| [Content inventory](./content-inventory.md) | Strapi/live URLs: CMS pages, blog themes, recipe silos |
| [Keyword validation](./keyword-validation.md) | Nuxt SEO Pro usage, SERP checks, tracked keyword list |
| [Priorities & silos](./priorities-and-silos.md) | Execution order, hub/spoke model, technical SEO checklist |
| [Product ↔ SEO](./product-features-seo.md) | Glossary, allergens, games, AI assist — mapped to search intent |
| [Monetization](./monetization.md) | Ads, affiliation (ustensiles-first), sponsors, legal disclosure |

## Context

- **Public app:** Nuxt 3/4 SSR (`cooking-blog`), `@nuxtjs/seo`, sitemaps, schema.org; Strapi v5 at `admin.journalducuistot.fr`.
- **Baseline (2026-08-12):** GSC connected and synced. Last 28d: **1 click / 346 impressions / avg pos 63** (prior 28d: 8 clicks / pos 23). Index coverage **~20%** (23/113). Full write-up: [seo-audit-2026-08.md](./seo-audit-2026-08.md).

## How to maintain

1. After Strapi import, refresh [content inventory](./content-inventory.md) from `/api/sitemap-ia` or CMS exports.
2. Before new hubs, run **SERP** analysis in SEO Pro on the exact French query (see [keyword validation](./keyword-validation.md)).
3. Update [priorities](./priorities-and-silos.md) quarterly from GSC queries and SEO Pro `rankings`.
4. Re-run a site audit monthly (`/nuxt-seo-pro/seo_audit_site` with `siteUrl=https://journalducuistot.fr`) and add or refresh `seo-audit-YYYY-MM.md`.

## Related

- [Architecture overview](../architecture/overview.md)
- [CMS ↔ Strapi schema audit](../architecture/cms-strapi-schema-audit.md)
- [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) — migration and Comark/web cutover
