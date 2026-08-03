# CI/CD — Alchemy deploy (GitHub Actions)

Automated Cloudflare deploys follow [Alchemy Part 5: CI/CD](https://alchemy.run/cloudflare/tutorial/part-5/).

## What runs in GitHub Actions

| Event | Stage | Action |
| --- | --- | --- |
| Push to `main` | `prod` | `pnpm alchemy deploy` |
| PR opened / updated | `pr-{number}` | Deploy isolated preview stack |
| PR closed | `pr-{number}` | `pnpm alchemy destroy` (never `prod`) |

Workflow: `.github/workflows/deploy.yml`. Remote Alchemy state is enabled via `CI=true` (see `alchemy.run.ts`).

**Production domains** (only when `stage === prod`): Web `journalducuistot.fr`, CMS `admin.journalducuistot.fr` — configured in `infra/workers.ts` via Worker `domain`. The `journalducuistot.fr` zone must already be on your Cloudflare account; Alchemy provisions DNS + TLS for those hostnames on deploy.

## One-time setup (from your laptop)

1. **Remote state** — If deploys fail with state RPC errors: `pnpm bootstrap:alchemy --force` (see root `alchemy.run.ts` comment).

2. **Admin profile** — Credentials that can create account API tokens:
   ```bash
   pnpm login:alchemy --profile admin
   ```
   Use Global API Key or a token with User/Account **API Tokens Write**. Do not use `admin` for day-to-day deploys.

3. **GitHub stack** — Mint CI token and push repository secrets:
   ```bash
   export ALCHEMY_GITHUB_OWNER=your-org
   export ALCHEMY_GITHUB_REPOSITORY=your-repo
   export NUXT_SESSION_PASSWORD='…'   # optional; also pushed as Actions secret if set
   pnpm deploy:github
   ```
   Stack definition: `stacks/github.ts`.

4. **Session secret** — If you skipped `NUXT_SESSION_PASSWORD` above, add **Settings → Secrets → Actions** manually. CMS Worker requires it at deploy time.

5. **Push workflow** — Commit `.github/workflows/deploy.yml` and merge to `main` on GitHub.

## PR previews

On each PR deploy, Alchemy posts/updates a comment with Web and CMS worker URLs (`alchemy.run.ts` + `GITHUB_TOKEN` from Actions).

## Note on CMS URL in preview builds

Web’s Nuxt build can bake `NUXT_PUBLIC_CMS_BASE_URL` at build time. Per-stage preview CMS URLs may need a follow-up (runtime config or two-phase build) if previews must call the matching CMS worker URL.
