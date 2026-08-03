/**
 * One-shot stack: mint a scoped Cloudflare API token for CI and push secrets to GitHub.
 *
 * Deploy locally with elevated credentials (not your day-to-day profile):
 *   pnpm deploy:github
 *
 * Repository is resolved from .env, GITHUB_REPOSITORY, or `git remote origin`.
 *
 * @see https://alchemy.run/cloudflare/tutorial/part-5/
 */
import * as Alchemy from 'alchemy'
import * as Cloudflare from 'alchemy/Cloudflare'
import * as GitHub from 'alchemy/GitHub'
import * as Config from 'effect/Config'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import { githubRepositoryEffect } from '../infra/github-repository.ts'

const useRemoteState =
  process.env.CI === 'true' || process.env.ALCHEMY_REMOTE_STATE === '1'

/** Permissions required by `alchemy.run.ts` (D1, R2, KV, Workers, AI Gateway, state store). */
const CI_PERMISSION_GROUPS = [
  'Secrets Store Write',
  'Workers Scripts Write',
  'Workers KV Storage Write',
  'Workers R2 Storage Write',
  'D1 Write',
  'Queues Write',
  'Account Settings Write',
  'Workers Tail Read',
  'AI Gateway Write',
  'DNS Write',
] as const

export default Alchemy.Stack(
  'github',
  {
    providers: Layer.mergeAll(
      Cloudflare.providers(),
      GitHub.providers(),
    ),
    state: useRemoteState ? Cloudflare.state() : Alchemy.localState(),
  },
  Effect.gen(function* () {
    const { owner, repository } = yield* githubRepositoryEffect
    const { accountId } = yield* yield* Cloudflare.CloudflareEnvironment

    const apiToken = yield* Cloudflare.ApiToken.AccountApiToken('CIToken', {
      accountId,
      policies: [
        {
          effect: 'allow',
          permissionGroups: [...CI_PERMISSION_GROUPS],
          resources: {
            [`com.cloudflare.api.account.${accountId}`]: '*',
          },
        },
      ],
    })

    yield* GitHub.Secret('cf-api-token', {
      owner,
      repository,
      name: 'CLOUDFLARE_API_TOKEN',
      value: apiToken.value,
    })

    yield* GitHub.Secret('cf-account-id', {
      owner,
      repository,
      name: 'CLOUDFLARE_ACCOUNT_ID',
      value: Redacted.make(accountId),
    })

    const sessionPassword = yield* Config.redacted('NUXT_SESSION_PASSWORD').pipe(
      Config.option,
    )
    if (sessionPassword._tag === 'Some') {
      yield* GitHub.Secret('nuxt-session-password', {
        owner,
        repository,
        name: 'NUXT_SESSION_PASSWORD',
        value: sessionPassword.value,
      })
    }
  }),
)
