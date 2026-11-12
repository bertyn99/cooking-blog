# SEO Roast Roadmap: journalducuistot.fr (2026-11-12)

Goal stated by founder: enough traffic to monetize via (a) cooking/kitchen-tool affiliation, (b) Google Ads.

Verdict: **The monetization machine is built and switched off at every layer — the utensil money page was noindexed, the glossary (affiliate surface) is 100% drafts with zero affiliate URLs, and at 277 pageviews/month no ad network pays rent. The bottleneck is not ads integration. It is indexable money pages + traffic volume.**

## Traffic reality (Umami, first-party — Nov 2026)

| Metric | Last 30d | Prev 30d |
|---|---|---|
| Pageviews | **277** | 102 |
| Visitors | 186 | 40 |
| Visits | 208 | 57 |
| Bounce rate | ~82% | ~68% |
| Traffic source | ~97% search (Google 47, Ecosia 15, Bing 11, Qwant 11, DDG 8) | — |

12-month total ≈ **1,435 pageviews**. Top page: an apéritif listicle (32 views). The engine is growing 2.7x month-over-month but starts near zero.

**Monetization math, honestly:**
- Google Ads, FR food niche (€5–12 RPM): 277 pv ≈ **€1.5–3/mo**. Break-even worth having ≈ 5k pv/mo (€25–60), real money ≈ 15k pv/mo (€75–180).
- Amazon affiliation, kitchen tools (~3–5%): 186 visitors/mo ≈ **0–1 sales/mo**. Real revenue starts at roughly 10–20k pv/mo on utensil-intent pages.
- → Every row below is judged by one question: does it add indexable, intent-matching pages or rankings that move the 277 toward 10,000?

| # | Tier | Issue | Revenue impact | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | REVENUE | Guide des ustensiles (the affiliate money page) served `noindex, follow` — draft-era metaRobots carried into publication; meta description literally said "Brouillon". 213 words thin, zero internal links in, excluded from sitemap | The one page built to earn tool commissions was invisible to Google | CMS seoMeta fixed live (upsert-seo, page id 26) → `index, follow, max-image-preview:large` + real description; footer sitewide link shipped | agent | **fixed + live** |
| 2 | REVENUE | No ads.txt, no AdSense script, no consent platform. Old AdSense snippet was commented out under Partytown (which Google ads don't support anyway) | Every month without consent infra is a month of zero ad revenue once traffic arrives | Env-gated async AdSense script (`NUXT_ADSENSE_CLIENT`) + `/ads.txt` route that 404s until configured — flip-the-switch ready. Plain async, not Partytown | agent | shipped in PR |
| 3 | FATAL for AI search | Cloudflare managed robots.txt blocks GPTBot, ClaudeBot, Google-Extended and sets `ai-train=no` — directly contradicting the nuxt block in the same file (`Content-Signal: ai-train=yes`). First block wins → AI engines read the site as ai-train=no. OAI-SearchBot + PerplexityBot are allowed (good) | ChatGPT/Claude can't cite the recipes; the site's own llms.txt + botNegotiation + sitemap-ia infra is throttled at the front door | Cloudflare dashboard → Security → Bots → remove GPTBot/ClaudeBot from managed block (or toggle Content Signals to allow ai-train), so the file stops contradicting itself. Keep training-blocked only if you explicitly reject AI visibility | **human** (dashboard) | pending |
| 4 | REVENUE | Google-certified CMP (consent banner) missing — mandatory for EEA/UK ad traffic since 2024-01; self-made banners not accepted. Privacy policy page exists ✓ | AdSense policy violation → limited/no ads served in France without it | Enable Google's own CMP via AdSense (Funding Choices) or pick a certified vendor; connect consent signal to the AdSense script gate | founder | pending decision |
| 5 | REVENUE | Affiliate layer empty: 20 glossary terms ALL draft (policy: draft+noindex until human publishes), only 1 is a utensil, **zero ASINs/partner URLs**. Meanwhile the 5 indexed `materiels-ustensils` articles (poêles guide already gets 10 views/mo) carry **zero affiliate links** | The affiliate plumbing exists (Amazon tag `jdc-21`, `resolveGlossaryAffiliateUrl` in CMS) but has nothing to point at | (a) draft 20–30 utensil terms targeting search queries ("couteau d'office", "cocotte en fonte"…), human publishes them; (b) add affiliate modules/links into the 5 utensil articles; (c) link recipe utensil lists → glossary once terms are live | agent drafts / **human publishes** | pending |
| 6 | COMPOUNDING | Traffic is 277 pv/mo — every revenue estimate is a rounding error until this is 50–100x. Site has 76 recipes + 46 articles + 30 pages; listicles outperform (top page is one); winter seasonal program (9 subjects W1–W9) + Pinterest pipeline already staged in repo | This row IS the revenue; rows 1–5 just stop the leaking | Keep the batch cadence (2–4 posts/week), prioritize utensil-intent and listicle formats, push Pinterest (2:3 fresh pins already pipeline'd) | agent + founder | ongoing |
| 7 | REVENUE hygiene | Live sitemap still lists stray `/les-epices-essentielles-en-cuisine-1` duplicate — the 301 + sitemap exclusion are committed (1054d70) but prod lags one commit | Duplicate-content dilution, minor | Deploy pending commits, verify pages.xml | founder (deploy) | self-heals on deploy |
| 8 | COMPOUNDING | Backlink/authority data gap — no Ahrefs/DataForSEO/GSC access in this session; 12-month referrer mix (Ecosia/Qwant/Lilo over-represented) suggests a young, low-authority domain | Can't size the link gap without data; recipes are the natural linkable asset | Connect GSC + pull DR/referring-domains for the site and 2–3 French food competitors (marmiton clones, cuisine-test) before spending on links | founder | data needed |

## Fluff (ignore until every row above ships)

- Alt-text coverage, heading-order, meta-length audits not run — fluff tier deliberately blocked. An alt tag on a page earning 277 views/month earns nothing.
- `materiels-ustensils` category slug typo (missing "e"): permanent URL, indexed, NOT worth a 301 of a whole category for cosmetics.
- `pnpm typecheck` has 27 pre-existing TS errors in `packages/shared/` — untouched by the roast fixes, not revenue-relevant.

## Verification (after next deploy)

```bash
# 1. Money page indexable + in sitemap
curl -s https://journalducuistot.fr/techniques-culinaires/guide-des-ustensiles | grep -o 'name="robots"[^>]*'
curl -s https://journalducuistot.fr/__sitemap__/pages.xml | grep -c guide-des-ustensiles   # → 1

# 2. Stray duplicate gone from sitemap
curl -s https://journalducuistot.fr/__sitemap__/pages.xml | grep -c 'epices-essentielles-en-cuisine-1'   # → 0

# 3. AI crawler contradiction resolved (after Cloudflare change)
curl -s https://journalducuistot.fr/robots.txt   # one consistent Content-Signal story

# 4. ads.txt flips when AdSense is approved + NUXT_ADSENSE_CLIENT set
curl -s -o /dev/null -w '%{http_code}\n' https://journalducuistot.fr/ads.txt   # 404 until then
```
