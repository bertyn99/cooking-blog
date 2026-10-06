# SEO strategy — Journal du Cuistot

**Status:** Living document  
**Last updated:** 2026-10-02  
**Site:** [journalducuistot.fr](https://journalducuistot.fr)  
**Locale:** `fr-FR`

This folder captures post–Strapi-migration SEO direction: what we already publish, which queries to target, how we validate ideas, how product features support traffic, and [monetization](./monetization.md) (affiliation focused on **ustensiles**, not ingredients).

**Issue tracker:** Linear project [jdc](https://linear.app/yggdraz/project/jdc-95b7c8989392) (see root `AGENTS.md`).

## Documents

| Document | Purpose |
|----------|---------|
| [SEO audit (2026-08)](./audit/seo-audit-2026-08.md) | Deep GSC + technical audit: performance, quick wins, defense, action plan |
| [Content inventory](./content-inventory.md) | Strapi/live URLs: CMS pages, blog themes, recipe silos |
| [Keyword validation](./keyword-validation.md) | Nuxt SEO Pro usage, SERP checks, tracked keyword list |
| [Priorities & silos](./priorities-and-silos.md) | Execution order, hub/spoke model, technical SEO checklist |
| [Product ↔ SEO](./product-features-seo.md) | Glossary, allergens, games, AI assist — mapped to search intent |
| [Monetization](./monetization.md) | Ads, affiliation (ustensiles-first), sponsors, legal disclosure |

## Context

- **Public app:** Nuxt SSR (`cooking-blog`), `@nuxtjs/seo`; CMS at `admin.journalducuistot.fr`. Strapi is import-only.
- **Baseline (2026-08-12):** Last 28d **1 click / 346 impressions / pos 63**. Index **~20%** (23/113). Write-up: [seo-audit-2026-08.md](./audit/seo-audit-2026-08.md).
- **Refresh (2026-10-02, Nuxt SEO Pro):** Last 28d **6 clicks / 568 impressions / pos 57**. Index **21%** (24/113). Last 12m **280 clicks / 9,382 impressions**; prior 12m was **705 / 23,362**. Peak month: **Oct 2025 = 4,884 impressions**. Parents restored; live blocker is **duplicate 200s** (nested + root) — [YGG-81](https://linear.app/yggdraz/issue/YGG-81).
- **Refresh (2026-10-06, GSC API + CMS MCP):** Last 28d **8 clicks / 502 impressions / pos 50** (prior 28d: 0 clicks / pos 79). Key URLs re-indexed. Recovery confirmed; bottleneck is now content tuning — see [seo-audit-2026-10.md](./audit/seo-audit-2026-10.md).

### Goal check — 100K impressions in December 2026

**Not a 90-day target.** 100K in December is ~20× the best month on record and ~176× the current 28-day run-rate. DataForSEO still supports the **silo strategy** (yassa 2,400 vol / diff 11; thiéboudienne 4,400 / diff 2; JDC already #4 for `dessert afrique du nord`), but that math yields **thousands** of monthly impressions if those URLs rank, not 100K.

| Horizon | Realistic impression band | Condition |
|---------|---------------------------|-----------|
| Dec 2026 (as-is) | 0.5–2K | Import may restore parents; no content push |
| Dec 2026 (Phase 1–2 executed) | 3–8K | 301s + index sitemap + reclaim 3 apéro/dessert URLs |
| Dec 2026 (aggressive niche) | 8–20K optimistic | Plus 20–30 Africa/monde recipes; Google recrawls in time |
| 100K / month | 2027+, different scale | Dozens of page-1 mid-volume recipes + links + stable tree |

**Honest Dec OKR:** get back to Oct-2025-class visibility (~5K impr./month), not 100K. Keep [priorities & silos](./priorities-and-silos.md); finish Phase 1 before Phase 3 glossary / allergens / programmatic hubs.

## How to maintain

1. After Strapi import, refresh [content inventory](./content-inventory.md) from `/api/sitemap-ia` or CMS exports.
2. Before new hubs, run **SERP** analysis in SEO Pro on the exact French query (see [keyword validation](./keyword-validation.md)).
3. Update [priorities](./priorities-and-silos.md) quarterly from GSC queries and SEO Pro `rankings`.
4. Re-run a site audit monthly (`/nuxt-seo-pro/seo_audit_site` with `siteUrl=https://journalducuistot.fr`) and add or refresh `seo-audit-YYYY-MM.md`.

## Related

- [Architecture overview](../architecture/overview.md)
- [CMS ↔ Strapi schema audit](../architecture/cms-strapi-schema-audit.md)
- [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) — migration and Comark/web cutover
