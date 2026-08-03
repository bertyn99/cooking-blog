/**
 * Journal du Cuistot — Alchemy v2 stack
 * @see https://v2.alchemy.run/getting-started
 *
 * Stages: `prod` (main) and `preview` (dev). See docs/architecture/ci-cd-alchemy.md.
 */
import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as Command from 'alchemy/Command'
import * as Drizzle from 'alchemy/Drizzle'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { database } from './infra/database.ts'
import { loadProjectEnv } from './infra/github-repository.ts'
import { storage } from './infra/storage.ts'
import { workers } from './infra/workers.ts'

loadProjectEnv()

// Remote Cloudflare state store requires a matching worker script.
// If you see "listResources" RPC errors, run: pnpm bootstrap:alchemy --force
const useRemoteState =
  process.env.CI === 'true' || process.env.ALCHEMY_REMOTE_STATE === '1'

export default Alchemy.Stack(
  'JournalDuCuistot',
  {
    providers: Layer.mergeAll(
      Cloudflare.providers(),
      Drizzle.providers(),
      Command.providers(),
    ),
    state: useRemoteState ? Cloudflare.state() : Alchemy.localState(),
  },
  Effect.gen(function* () {
    const { DB, AiReadyDB } = yield* database
    const { Media, Cache } = yield* storage
    const { Cms, Web } = yield* workers({ DB, AiReadyDB, Media, Cache })

    return {
      cmsUrl: Cms.url,
      webUrl: Web.url,
      databaseName: DB.databaseName,
      mediaBucket: Media.bucketName,
      cacheNamespaceId: Cache.namespaceId,
    }
  }),
)
