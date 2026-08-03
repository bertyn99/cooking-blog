# ADR-006: Image delivery on Cloudflare (jSquash + IPX vs native resizing)

## Status

**Accepted** — jSquash on CMS Worker with IPX URL syntax (2026-07-23)

## Context

Journal du Cuistot serves media from **R2** (`Media` binding) via the **CMS** Nitro app. The **public site** (`apps/web`) does not read R2 directly; it proxies `/images/**` to the CMS. On-demand resizing uses **[IPX](https://github.com/unjs/ipx)-style paths** (`/images/w_800,f_webp/uploads/…`), implemented with **[@jsquash](https://github.com/jamsinclair/jSquash)** in the CMS Worker.

Deployment is defined in **Alchemy v2** ([`alchemy.run.ts`](../../alchemy.run.ts)):

| Resource | Alchemy module | Worker binding | Used for |
|----------|----------------|----------------|----------|
| D1 | `infra/database.ts` | `DB` (CMS), `AI_READY_DB` (web) | Content, ai-ready |
| R2 | `infra/storage.ts` | `Media` (CMS only) | Original + ingest-optimized WebP blobs |
| KV | `infra/storage.ts` | `Cache` (CMS + web env) | Sessions, rate limits, import status |
| Workers | [`infra/workers.ts`](../../infra/workers.ts) | `Cms`, `Web` | SSR + `/images` transform (CMS), public site (web) |

There is **no** Cloudflare Images / `IMAGES` binding in Alchemy today. Web previously referenced `images.binding` in local `wrangler` config; that was removed in favour of a single transform owner on CMS.

Common Cloudflare reference patterns (for comparison):

- [Optimizing image delivery with Image Resizing and R2](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/) — edge cache → R2 origin → **`/cdn-cgi/image/…`** transforms
- [Building a free image CDN with R2 and Workers](https://transloadit.com/devtips/creating-a-free-image-cdn-with-cloudflare-r2/) — Worker reads R2, applies **`cf.image`** on the `Response`, query params `w`, `h`, `q`, `f`

We need one transform implementation for **admin UI**, **public web**, and any future API clients, without tying URL generation to a single hostname’s `cdn-cgi` prefix.

## Options compared

### A — Current: jSquash + IPX on CMS Worker (accepted)

```
Browser → web Worker (/images/w_800,f_webp/key)
       → fetch CMS Worker (/images/w_800,f_webp/uploads/…)
       → R2 get → jSquash decode/resize/encode
       → Cache API (pathname key) + Cache-Control: 1y
```

| Criterion | Assessment |
|-----------|------------|
| **Alchemy fit** | Uses existing `Media` + `Cms` Worker only; no new bindings |
| **Multi-client** | Dashboard and web share CMS URLs / IPX modifiers |
| **Nuxt Image** | `localImageSharp` emits IPX ops (`w`, `h`, `f`, `q`, `s`, `fit`, `enlarge`) |
| **Formats** | WebP / JPEG / PNG; `f_avif` → WebP (no AVIF encoder in jSquash) |
| **`f_auto`** | Resolved from `Accept` in app code ([`image-delivery-policy.ts`](../../apps/cms/shared/image-delivery-policy.ts)) |
| **CPU / limits** | Worker WASM per cache miss; mitigated by 2560px cap, op sanitization, 502 on failure |
| **Edge cache** | Long `Cache-Control` + CF proxy on custom domains; Worker `caches.default` for repeat misses |
| **Cost** | R2 + Worker requests; no Images SKU |
| **Ops surface** | Subset of IPX (unsupported modifiers stripped) |

### B — Cloudflare Image Resizing via `cf.image` on R2 `Response` (Transloadit-style)

Worker returns `new Response(r2Body, { cf: { image: { width, height, quality, format, fit } } })`.

| Criterion | Assessment |
|-----------|------------|
| **Alchemy fit** | Still one `Cms` Worker + `Media`; no separate Images binding if using `cf` options on fetch/response (zone-dependent) |
| **URL syntax** | Tutorial uses **query string** (`?w=800&f=webp`), not IPX paths — would need a parser layer or URL rewrite at web |
| **Multi-client** | Possible if all clients hit the same Worker URL shape |
| **Formats** | **AVIF**, **`auto`**, broader Sharp-like behaviour at the platform |
| **CPU** | Less WASM in your Worker; work shifts to CF image stack |
| **Ingest** | Could keep jSquash on upload **or** store originals only and always transform at delivery |
| **Risk** | Two stacks if ingest stays jSquash and delivery uses `cf.image` (visual parity testing) |

### C — `/cdn-cgi/image/…` on the public zone (Cloudflare reference architecture)

Example: `https://www.example.com/cdn-cgi/image/width=80,quality=75/uploads/image.jpg`

| Criterion | Assessment |
|-----------|------------|
| **Alchemy fit** | Requires traffic on a **proxied zone** and path convention; not emitted by Nuxt IPX provider today |
| **Origin** | R2 or CMS as origin behind the zone; CF fetches original on cache miss |
| **Migration** | [Transform Rules](https://developers.cloudflare.com/rules/transform/) can map IPX → `cdn-cgi` if needed later |
| **Multi-client** | Public site fits; **CMS admin on another host** (`admin.…`) needs its own route or still calls CMS `/images` |
| **Coupling** | Strong tie to Cloudflare zone layout; weaker portability |

### D — Hybrid: jSquash ingest + native delivery

| Phase | Tool |
|-------|------|
| Upload / import | jSquash → WebP in R2 (current [`image-optimize-pipeline.ts`](../../apps/cms/shared/image-optimize-pipeline.ts)) |
| `GET /images/…` | `cf.image` or Images binding instead of jSquash |

Reduces duplicate encode logic for **delivery** but splits behaviour and test matrices.

## Side-by-side summary

| | **A jSquash + IPX (now)** | **B `cf.image` Worker** | **C `cdn-cgi/image`** |
|--|---------------------------|-------------------------|------------------------|
| Bindings (Alchemy) | `Media`, `Cache` | `Media`, `Cache` | Zone + origin (R2/CMS) |
| Transform owner | CMS Worker code | CMS Worker + CF | Edge / CF Images |
| URL style | `/images/w_800,f_webp/…` | Usually query or custom | `/cdn-cgi/image/width=80,…/path` |
| Web app role | Proxy + forward `Accept` | Same | Often direct to CDN host |
| AVIF | No (WebP fallback) | Yes | Yes |
| Dashboard thumbs | CMS IPX presets | Same or query API | Same if same host |
| Local dev | libSQL + `.data/media` + jSquash | `cf.image` often **prod-only** | N/A locally |
| Abuse controls | KV rate limit on `/images/**` | Same + platform limits | Platform + WAF |

## Alchemy Workers Cache (deploy-time)

[Alchemy Workers Cache](https://alchemy.run/cloudflare/compute/cache/) enables **read-through edge caching in front of the Worker**. On a cache hit, Cloudflare serves the stored response **without invoking** the Worker handler (unlike the programmatic [Cache API](https://developers.cloudflare.com/workers/cache/limitations/), which still runs your code on every request).

Configured in [`infra/workers.ts`](../../infra/workers.ts) on the **Cms** Worker only (not **Web** — see pricing below):

```typescript
const CMS_WORKERS_CACHE = {
  enabled: true,
  crossVersionCache: true,
} as const

// Cloudflare.Worker('Cms', { ..., cache: CMS_WORKERS_CACHE })
// Cloudflare.Worker('Web', { ... }) — no cache prop
```

### Workers Cache pricing (checked against Cloudflare docs)

[Workers Cache pricing](https://developers.cloudflare.com/workers/cache/) has **no separate SKU**: every request to a Worker with caching enabled is billed at the **standard Workers request rate**, including **cache hits** (no CPU on hits). The important caveat:

> When caching is enabled, every request to your Worker is charged at the standard Workers request rate, **including requests that are normally free**: static asset requests and worker-to-worker invocations.

| Request type | Request charge | CPU |
|--------------|----------------|-----|
| Cache **HIT** (Worker does not run) | Standard rate | Not billed |
| Cache **MISS** / bypass | Standard rate | Billed |
| Static asset (cache **disabled**) | **Free** ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)) | Not billed |
| Static asset (cache **enabled**) | Standard rate | Not billed |

**Implications for this project:**

| Worker | Workers Cache | Rationale |
|--------|---------------|-----------|
| **Web** | **Off** | High volume of `/_nuxt/*` and `public/` static assets; enabling cache would bill every asset request. Public HTML still uses Redis ISR / `Cache-Control` as today. `/images/**` proxy is cheap CPU; browsers cache via long `Cache-Control` from CMS. |
| **Cms** | **On** | Pays request charges on admin static assets too, but **image cache hits avoid jSquash CPU** (main cost driver). Public `/images` reached via Web `fetch` to CMS still benefits from **CMS** edge cache on that subrequest ([subrequests are not billed](https://developers.cloudflare.com/workers/platform/pricing/) as separate inbound requests — the **CMS** worker still sees one inbound request per subrequest). **Admin traffic is ~1–5 users/day**, so billing `/_nuxt/*` on Cms is negligible vs public image volume. |

Revisit enabling cache on **Web** only if traffic shifts to mostly cacheable `/images/**` and static assets move off the Worker (e.g. separate asset host).

| Concern | How we handle it |
|---------|-------------------|
| **What gets cached** | Response headers only: `Cache-Control`, `Cache-Tag`, `Vary` ([Alchemy docs](https://alchemy.run/cloudflare/compute/cache/)) |
| **Images (CMS)** | `Cache-Control: public, max-age=31536000, stale-while-revalidate=604800`, `Cache-Tag: media,media-path-…`, `Vary: Accept` when transforms run |
| **Images (web proxy)** | Forwards CMS `Cache-Control`, `Cache-Tag`, and `Vary` (browser cache; no Workers Cache on Web) |
| **Admin / API** | Must keep `Cache-Control: private` or `no-store` on authenticated HTML and `/api/*` (Nuxt defaults) so Workers Cache does not store sessions |
| **crossVersionCache** | Image bytes are content-addressed by URL; safe to share cached variants across deploys |
| **Purge** | `Cache-Tag` + `ctx.cache.purge({ tags })` on blob delete ([`workers-image-cache.ts`](../../apps/cms/server/utils/workers-image-cache.ts)) and maintenance media wipe |
| **Local dev** | `cache` prop applies only after `alchemy deploy`; `pnpm dev:cms` / `dev:web` have no Workers Cache |

**Removed:** in-handler `caches.default` put/match in `serve-image.ts` — redundant once Workers Cache is enabled in production.

## Alchemy deployment diagram (accepted architecture)

```mermaid
flowchart LR
  subgraph Edge["Workers Cache (CMS only)"]
    WCms["Cms cache"]
  end
  subgraph WebWorker["Web Worker (no Workers Cache)"]
    WImg["/images/* proxy"]
  end
  subgraph CmsWorker["CMS Worker"]
    CImg["/images/* IPX + jSquash"]
    API["/api/*"]
  end
  R2[(R2 Media)]
  D1[(D1 DB)]
  KV[(KV Cache)]

  User --> WImg
  WImg -->|fetch| WCms
  WCms -->|miss| CImg
  CImg --> R2
  API --> D1
  API --> KV
  CImg --> KV
```

On **hit**, the edge returns bytes and inner Workers are not executed (including KV rate limit on that request — acceptable for immutable image URLs).

## Decision

1. **Keep option A** for production on Alchemy: CMS owns transforms, IPX paths, jSquash, R2 originals.
2. **Web** remains a **proxy** to CMS for `/images/**` (no transform); **Workers Cache only on Cms** (see pricing).
3. **Do not** add Cloudflare Images binding to Alchemy until a deliberate migration (option B or D) is chosen and URL compatibility is designed.
4. **Follow-ups** (not blocking ADR):
   - ~~KV **rate limiting** on public `GET /images/**`~~ — implemented (`IMAGE_DELIVERY_RATE_LIMIT` in [`image-delivery-policy.ts`](../../apps/cms/shared/image-delivery-policy.ts), enforced in [`serve-image.ts`](../../apps/cms/server/utils/serve-image.ts)).
   - Optional shared `packages/image-ipx` if `apps/web` should stop importing `apps/cms/shared/ipx-image-path.ts`.
   - Revisit **B** if Worker CPU or AVIF becomes a product requirement.
   - ~~Consider **Workers Caching**~~ — enabled in [`infra/workers.ts`](../../infra/workers.ts); see section above.
   - ~~**Purge hook** on media delete~~ — `purgeImageDeliveryCache` / `purgeAllMediaImageCache` in [`workers-image-cache.ts`](../../apps/cms/server/utils/workers-image-cache.ts).
   - Admin HTML: [`server/middleware/admin-private-cache.ts`](../../apps/cms/server/middleware/admin-private-cache.ts) sets `Cache-Control: private, no-store`.

## Consequences

### Positive

- Single code path for admin and web; aligns with Nuxt Image / IPX ecosystem.
- Alchemy **Workers Cache** on **Cms** only (`crossVersionCache` for image URLs); **Web** leaves cache off to preserve free static assets.
- Policy layer (max edge, sanitize ops, path guard, transform failure → 502) is explicit in repo.

### Negative

- Higher Worker CPU on cache cold starts than native resizing.
- No true AVIF without changing option or adding a second encoder.
- `cf.image` behaviour in local `nuxt dev` does not mirror production unless mocked.
- **Workers Cache on Cms** bills standard requests for admin `/_nuxt/*` assets that were previously free; offset by lower CPU on image cache hits ([pricing](https://developers.cloudflare.com/workers/cache/)).

### When to revisit

- Sustained **CPU/time limits** on CMS Worker image routes in production metrics.
- Requirement for **AVIF** or full IPX modifier parity (rotate, blur, etc.) without maintaining jSquash.
- Desire to serve images **only** from the public zone with **no CMS hop** (then C + Transform Rules or B with a dedicated `cdn.` worker route).

## References

- [Cloudflare: Optimizing image delivery with Image Resizing and R2](https://developers.cloudflare.com/reference-architecture/diagrams/content-delivery/optimizing-image-delivery-with-cloudflare-image-resizing-and-r2/)
- [Transloadit: Free image CDN with R2 and Workers](https://transloadit.com/devtips/creating-a-free-image-cdn-with-cloudflare-r2/)
- [unjs/ipx](https://github.com/unjs/ipx) — URL modifier conventions
- [jSquash Cloudflare Worker example](https://github.com/jamsinclair/jSquash/tree/main/examples/cloudflare-worker-esm-format)
- [Cloudflare Workers Cache (pricing)](https://developers.cloudflare.com/workers/cache/)
- [Workers platform pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Alchemy Workers Cache](https://alchemy.run/cloudflare/compute/cache/)
- Implementation: [`infra/workers.ts`](../../infra/workers.ts), [`apps/cms/server/utils/serve-image.ts`](../../apps/cms/server/utils/serve-image.ts), [`apps/cms/shared/image-delivery-policy.ts`](../../apps/cms/shared/image-delivery-policy.ts), [`apps/web/server/utils/serve-cms-image.ts`](../../apps/web/server/utils/serve-cms-image.ts)
