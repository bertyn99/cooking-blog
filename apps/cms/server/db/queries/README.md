# Database query layer (`server/db/queries`)

All Drizzle access for the CMS server goes through this folder. Handlers and services call `useQueries(event)` (or `createDbQueries(db)` in tasks) instead of `useDb` + raw `db.select` / `db.insert`.

## Layout

```
server/db/queries/
├── index.ts              # createDbQueries() — aggregates all factories
├── _shared/
│   ├── filters.ts        # published scope, locale, search helpers
│   └── builders/         # relation/include WHERE builders (no I/O)
├── articles.ts           # list, find, create, update, soft delete
├── recipes.ts            # + ingredients, utensils, nutrition
├── pages.ts              # hierarchy, slug reservation, parent cycle check
├── categories.ts
├── category-articles.ts
├── users.ts
├── seo.ts
├── publishing.ts         # publish / schedule / unpublish / CRON due
├── calendar.ts
├── dashboard.ts
├── maintenance.ts
├── blobs.ts              # media catalog (blobs table)
└── legacy-strapi-map.ts
```

## Conventions

- **Factory pattern:** `export function createXQueries(db: AppDb) { return { ... } }`
- **Builders** under `_shared/builders/` are pure functions (no `db` argument); entity files run queries.
- **Services** (`server/services/*`) orchestrate HTTP, storage, or Strapi; they delegate persistence to `createDbQueries(db)`.
- **Tasks** and **seed** scripts may use `createDbQueries(getLocalDb())` or `useDb(event)` + `createDbQueries`.

## Entry points

```ts
import { useQueries } from '~/server/utils/db'

const { articles, publishing } = useQueries(event)
await articles.insert({ ... })
await publishing.publish('articles', id)
```

Do not add new `db.insert` / `db.select` calls outside `server/db/queries/` (exceptions: migrations, `db/client.ts`, `create-db.ts`).
