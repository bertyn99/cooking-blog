# CI/CD — Alchemy deploy (GitHub Actions)

Automated Cloudflare deploys follow [Alchemy Part 5: CI/CD](https://alchemy.run/cloudflare/tutorial/part-5/), simplified to **two stages**.

## Stages

| Event | Stage | Action |
| --- | --- | --- |
| Push to `main` | `prod` | `pnpm alchemy deploy --stage prod` |
| Push to `dev` | `preview` | `pnpm alchemy deploy --stage preview` |

Workflow: `.github/workflows/deploy.yml`. Remote Alchemy state is enabled via `CI=true` (see `alchemy.run.ts`).

**Production domains** (only when `stage === prod`): Web `journalducuistot.fr`, CMS `admin.journalducuistot.fr` — configured in `infra/workers.ts` via Worker `domain`. The `journalducuistot.fr` zone must already be on your Cloudflare account; Alchemy provisions DNS + TLS for those hostnames on deploy.

**Preview** uses `*.workers.dev` URLs (no custom domain). Web points at the preview CMS Worker URL.

## App secrets (Actions)

Set via `pnpm deploy:github` from `.env`, or manually under **Settings → Secrets → Actions**:

| Secret | Used by |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Alchemy CI |
| `NUXT_SESSION_PASSWORD` | CMS Worker (sessions) |
| `NUXT_OG_IMAGE_SECRET` | CMS + Web Workers |
| `STRAPI_URL` | CMS Strapi import — also bound as `NUXT_STRAPI_URL` (Nuxt runtimeConfig override) |
| `STRAPI_API_TOKEN` | Optional; also bound as `NUXT_STRAPI_API_TOKEN` |

## One-time setup (from your laptop)

1. **Remote state** — If deploys fail with state RPC errors: `pnpm bootstrap:alchemy --force` (see root `alchemy.run.ts` comment).

2. **Admin profile** — Credentials that can create account API tokens:
   ```bash
   pnpm login:alchemy --profile admin
   ```
   Use Global API Key or a token with User/Account **API Tokens Write**. Do not use `admin` for day-to-day deploys.

3. **GitHub stack** — Mint CI token and push repository secrets from `.env`:
   ```bash
   # Ensure .env has NUXT_SESSION_PASSWORD, NUXT_OG_IMAGE_SECRET, STRAPI_URL, …
   pnpm deploy:github
   ```
   Stack definition: `stacks/github.ts`.

4. **Push workflow** — Commit `.github/workflows/deploy.yml` and push to `dev` / merge to `main`.

## Local deploys

```bash
pnpm alchemy deploy --stage preview --yes
pnpm alchemy deploy --stage prod --yes
```
