# Journal du Cuistot — Documentation

Architecture and decision records for the **journalducuistot** pnpm monorepo (French cooking blog at [journalducuistot.fr](https://journalducuistot.fr)).

## Architecture

| Document | Description |
|----------|-------------|
| [Overview](./architecture/overview.md) | Monorepo layout, app responsibilities, and data flow |
| [ADR-001: `apps/web` + `apps/cms`](./architecture/adr-001-monorepo-apps-web-cms.md) | Two Nuxt apps instead of a shared layer |
| [ADR-002: Schemas in CMS](./architecture/adr-002-schemas-in-cms-not-shared-package.md) | Drizzle schemas colocated in `apps/cms`, no `packages/db` |
| [ADR-003: Oxlint + Oxfmt](./architecture/adr-003-oxlint-oxfmt-tooling.md) | Lint and format tooling across the monorepo |
| [ADR-004: TypeScript 6](./architecture/adr-004-typescript-6.md) | TypeScript 6 baseline and rollout |
| [Oxlint migration report](./architecture/oxlint-migration-report.md) | `@oxlint/migrate` results from Nuxt ESLint configs |

## Related planning

Implementation milestones and future work (Alchemy v2, Comark, Strapi extract) are tracked in [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) at the repository root.

## ADR format

Each Architecture Decision Record (ADR) follows:

- **Status** — accepted, proposed, or superseded
- **Context** — forces and constraints
- **Decision** — what we chose
- **Consequences** — trade-offs and follow-ups
